import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { m } from "@/paraglide/messages";

interface PostEditorConflictBannerProps {
  /** 服务端记录的最近修改时间（毫秒），未知时为 null */
  currentUpdatedAt: number | null;
  onOverwrite: () => Promise<void>;
  onDiscard: () => void;
}

function formatTime(ms: number | null) {
  if (!ms) return "";
  return new Date(ms).toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function PostEditorConflictBanner({
  currentUpdatedAt,
  onOverwrite,
  onDiscard,
}: PostEditorConflictBannerProps) {
  const [overwriting, setOverwriting] = useState(false);
  const time = formatTime(currentUpdatedAt);

  const handleOverwrite = async () => {
    setOverwriting(true);
    try {
      await onOverwrite();
    } catch {
      // 失败已由上层写入保存状态，这里只负责收尾 loading
    } finally {
      setOverwriting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-500/30 bg-amber-500/10 px-6 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <AlertTriangle size={14} className="shrink-0 text-amber-600" />
        <p className="truncate text-xs text-amber-700 dark:text-amber-400">
          <span className="font-medium">{m.editor_conflict_title()}</span>
          <span className="ml-2 font-normal text-amber-700/80 dark:text-amber-400/80">
            {time
              ? m.editor_conflict_desc({ time })
              : m.editor_conflict_desc_unknown()}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          className="h-7 rounded-none text-[10px] font-mono uppercase tracking-[0.14em]"
        >
          {m.editor_conflict_discard()}
        </Button>
        <Button
          size="sm"
          onClick={() => void handleOverwrite()}
          disabled={overwriting}
          className="h-7 rounded-none text-[10px] font-mono uppercase tracking-[0.14em]"
        >
          {overwriting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            m.editor_conflict_overwrite()
          )}
        </Button>
      </div>
    </div>
  );
}
