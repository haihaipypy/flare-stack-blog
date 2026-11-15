import { RotateCcw } from "lucide-react";
import { useCallback, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { SystemConfig } from "@/features/config/config.schema";
import {
  bannerObjectPosition,
  DEFAULT_BANNER_FOCUS,
} from "@/features/config/site-config.schema";
import { m } from "@/paraglide/messages";

const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value)));

interface BannerFocusFieldProps {
  /** 表单里封面图字段的路径，用于取缩略图做实时预览 */
  imageName:
    | "site.theme.fuwari.homeBg"
    | "site.theme.default.background.homeImage"
    | "site.theme.default.background.globalImage";
  label: string;
  hint: string;
}

/**
 * 封面图焦点选择器：拖动画面即改变 object-position，
 * 宽图在窄屏被裁切时可以保住主体。
 */
export function BannerFocusField({
  imageName,
  label,
  hint,
}: BannerFocusFieldProps) {
  const { control, setValue } = useFormContext<SystemConfig>();
  const image = useWatch({ control, name: imageName }) as string | undefined;
  const focus = useWatch({ control, name: "site.bannerFocus" });
  const frameRef = useRef<HTMLDivElement>(null);

  const x = clampPercent(focus?.x ?? DEFAULT_BANNER_FOCUS.x);
  const y = clampPercent(focus?.y ?? DEFAULT_BANNER_FOCUS.y);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setValue(
        "site.bannerFocus",
        {
          x: clampPercent(((clientX - rect.left) / rect.width) * 100),
          y: clampPercent(((clientY - rect.top) / rect.height) * 100),
        },
        { shouldDirty: true },
      );
    },
    [setValue],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!image) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      apply(event.clientX, event.clientY);
    },
    [apply, image],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!image || event.buttons !== 1) return;
      apply(event.clientX, event.clientY);
    },
    [apply, image],
  );

  return (
    <div className="space-y-2 md:col-span-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <button
          type="button"
          onClick={() =>
            setValue(
              "site.bannerFocus",
              { ...DEFAULT_BANNER_FOCUS },
              {
                shouldDirty: true,
              },
            )
          }
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw size={12} />
          {m.settings_site_banner_focus_reset()}
        </button>
      </div>

      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className={`relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted/40 ${
          image ? "cursor-crosshair touch-none" : "cursor-not-allowed"
        }`}
        style={
          image
            ? {
                backgroundImage: `url("${image}")`,
                backgroundSize: "cover",
                backgroundPosition: bannerObjectPosition({ x, y }),
                backgroundRepeat: "no-repeat",
              }
            : undefined
        }
      >
        {!image && (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            {m.settings_site_banner_focus_empty()}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{hint}</span>
        <span className="font-mono tabular-nums">
          x {x}% · y {y}%
        </span>
      </div>
    </div>
  );
}
