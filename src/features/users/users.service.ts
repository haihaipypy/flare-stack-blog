import * as UserRepo from "@/features/users/data/users.data";
import type {
  GetUsersInput,
  UserListResult,
} from "@/features/users/users.schema";

/**
 * 后台用户列表：分页 + 关键词搜索 + 状态筛选。
 * 只读查询，不走缓存 —— 每有新注册就该立刻可见。
 */
export async function getUsers(
  context: DbContext,
  input: GetUsersInput,
): Promise<UserListResult> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const filter = input.filter ?? "all";
  const search = input.search?.trim() || undefined;

  const [total, stats] = await Promise.all([
    UserRepo.getUsersCount(context.db, { search, filter }),
    UserRepo.getUsersStats(context.db),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // 页码越界（比如筛选后变少）时回落到最后一页而不是给个空表
  const safePage = Math.min(page, totalPages);

  const items = await UserRepo.getUsers(context.db, {
    search,
    filter,
    limit: pageSize,
    offset: (safePage - 1) * pageSize,
  });

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
    stats,
  };
}
