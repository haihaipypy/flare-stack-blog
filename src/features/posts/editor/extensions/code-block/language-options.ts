import type { CodeLanguage } from "@/lib/code-languages";

/** 一个选择器条目：注册表里的语言，或纯文本（它没有语法）。 */
export type LanguageOption = Pick<CodeLanguage, "id" | "label" | "aliases">;

const NO_MATCH = 3;

/** 0 = 名字与查询完全相同，1 = 以其开头，2 = 包含它。 */
function matchRank(option: LanguageOption, needle: string) {
  let rank = NO_MATCH;
  for (const name of [option.label, option.id, ...option.aliases]) {
    const lower = name.toLowerCase();
    if (lower === needle) return 0;
    if (lower.startsWith(needle)) rank = Math.min(rank, 1);
    else if (lower.includes(needle)) rank = Math.min(rank, 2);
  }
  return rank;
}

/**
 * 按显示名、语法 id 或别名过滤语言选择器的选项，忽略大小写。完全匹配排最前，
 * 其次是前缀匹配，然后是其它包含匹配；同档次保持原有顺序。空查询返回全部。
 */
export function filterLanguageOptions<T extends LanguageOption>(
  options: ReadonlyArray<T>,
  query: string,
): Array<T> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...options];
  return options
    .map((option) => ({ option, rank: matchRank(option, needle) }))
    .filter(({ rank }) => rank < NO_MATCH)
    .sort((a, b) => a.rank - b.rank)
    .map(({ option }) => option);
}
