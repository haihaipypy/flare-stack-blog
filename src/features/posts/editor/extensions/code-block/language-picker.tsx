import { Check, ChevronDown, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  CODE_LANGUAGES,
  PLAIN_TEXT,
  PLAIN_TEXT_ALIASES,
  isPlainTextLanguage,
  resolveCodeLanguage,
} from "@/lib/code-languages";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import {
  filterLanguageOptions,
  type LanguageOption,
} from "./language-options";

const POPOVER_WIDTH = 208;
const POPOVER_MAX_HEIGHT = 320;
const VIEWPORT_MARGIN = 8;
const GAP = 4;

/** 纯文本没有语法，所以它不在注册表里，单独拼在末尾。 */
function pickerOptions(): Array<LanguageOption> {
  return [
    ...CODE_LANGUAGES,
    {
      id: PLAIN_TEXT,
      label: m.common_plain_text(),
      aliases: PLAIN_TEXT_ALIASES,
    },
  ];
}

/**
 * 代码块的语言选择器：触发器显示当前语言，点开后是一个带搜索框的浮层列表。
 * 焦点始终留在搜索框里，方向键移动高亮项，Enter 选中，Escape 关闭。
 */
export function LanguagePicker({
  value,
  onChange,
}: {
  /** 代码块里存的语言；别名会按其所属语言显示。 */
  value: string;
  onChange: (id: string) => void;
}) {
  const options = useMemo(pickerOptions, []);
  const currentId = isPlainTextLanguage(value)
    ? PLAIN_TEXT
    : (resolveCodeLanguage(value)?.id ?? value);
  const currentLabel =
    options.find((option) => option.id === currentId)?.label ?? value;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const listId = useId();
  const optionId = (id: string) => `${listId}-${id}`;

  const filtered = useMemo(
    () => filterLanguageOptions(options, query),
    [options, query],
  );
  const active = filtered[activeIndex];

  // 浮层跟随触发器：默认在下方，下方空间不足且上方更宽裕时翻到上方。
  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < POPOVER_MAX_HEIGHT && rect.top > spaceBelow;
      setStyle({
        position: "fixed",
        right: Math.max(
          VIEWPORT_MARGIN,
          Math.min(
            window.innerWidth - rect.right,
            window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN,
          ),
        ),
        width: POPOVER_WIDTH,
        top: openUp ? undefined : rect.bottom + GAP,
        bottom: openUp ? window.innerHeight - rect.top + GAP : undefined,
      });
    };

    // 在浮层内部滚动不应该重新定位触发器。
    const onScroll = (event: Event) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      update();
    };

    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // 键盘移动或输入导致高亮项变化时把它滚进视野，鼠标悬停不动列表。
  useEffect(() => {
    if (!open || !active) return;
    document
      .getElementById(optionId(active.id))
      ?.scrollIntoView?.({ block: "nearest" });
  });

  const openPicker = () => {
    setQuery("");
    setActiveIndex(
      Math.max(
        0,
        options.findIndex((option) => option.id === currentId),
      ),
    );
    setOpen(true);
  };

  const pick = (option: LanguageOption) => {
    onChange(option.id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (filtered.length === 0) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex(
          (current) => (current + step + filtered.length) % filtered.length,
        );
        return;
      }
      case "Enter":
        event.preventDefault();
        if (active) pick(active);
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      case "Tab":
        setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={m.editor_code_language()}
        aria-haspopup="listbox"
        aria-expanded={open}
        contentEditable={false}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex items-center gap-1 rounded-sm border border-zinc-200/50 dark:border-zinc-700/50 bg-white/60 dark:bg-zinc-900/40 px-2 py-0.5 font-mono text-xs font-medium uppercase text-zinc-600 dark:text-zinc-300 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
      >
        <span>{currentLabel}</span>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && style
        ? createPortal(
            <div
              ref={popoverRef}
              style={style}
              className="z-50 flex flex-col overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 px-3 py-2 text-zinc-400 focus-within:text-zinc-600 dark:focus-within:text-zinc-200">
                <Search size={14} aria-hidden="true" className="shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-label={m.editor_code_language_search()}
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    active ? optionId(active.id) : undefined
                  }
                  placeholder={m.editor_code_language_search()}
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
                />
              </div>

              <div
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={m.editor_code_language()}
                className="custom-scrollbar max-h-64 overflow-y-auto p-1"
              >
                {filtered.map((option, index) => {
                  const isActive = index === activeIndex;
                  const isCurrent = option.id === currentId;
                  return (
                    <div
                      key={option.id}
                      id={optionId(option.id)}
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => pick(option)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors",
                        isActive && "bg-zinc-100 dark:bg-zinc-800",
                        isCurrent
                          ? "text-zinc-900 dark:text-zinc-100"
                          : isActive
                            ? "text-zinc-700 dark:text-zinc-200"
                            : "text-zinc-500 dark:text-zinc-400",
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isCurrent ? (
                        <Check
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="shrink-0"
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {filtered.length === 0 ? (
                <p className="px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {m.editor_code_language_empty()}
                </p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
