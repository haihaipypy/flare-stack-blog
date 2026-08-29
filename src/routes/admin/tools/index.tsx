import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSystemSetting } from "@/features/config/hooks/use-system-setting";
import { m } from "@/paraglide/messages";

const toolsPageSchema = z.object({
  tools_page_title: z.string().max(120).optional(),
  tools_page_description: z.string().max(300).optional(),
  tools_page_content: z.string().optional(),
});

type ToolsPageForm = z.infer<typeof toolsPageSchema>;

export const Route = createFileRoute("/admin/tools/")({
  ssr: false,
  component: RouteComponent,
  loader: () => ({
    title: m.admin_tools_page_title(),
  }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title }],
  }),
});

function RouteComponent() {
  const { settings, saveSettings, isLoading } = useSystemSetting();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<ToolsPageForm>({
    resolver: zodResolver(toolsPageSchema),
    defaultValues: {
      tools_page_title: "",
      tools_page_description: "",
      tools_page_content: "",
    },
  });

  useEffect(() => {
    if (settings?.site) {
      reset({
        tools_page_title: settings.site.tools_page_title ?? "",
        tools_page_description: settings.site.tools_page_description ?? "",
        tools_page_content: settings.site.tools_page_content ?? "",
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: ToolsPageForm) => {
    try {
      await saveSettings({
        data: {
          ...settings!,
          site: {
            ...settings!.site,
            ...data,
          },
        },
      });
      toast.success(m.admin_tools_page_save_success());
      reset(data);
    } catch {
      toast.error(m.admin_tools_page_save_error());
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-muted/30 animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 bg-muted/30 animate-pulse" />
          <div className="h-10 bg-muted/30 animate-pulse" />
          <div className="h-40 bg-muted/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-5 border-b border-border/30">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-foreground">
            {m.admin_tools_page_header_title()}
          </h1>
          <p className="text-sm text-muted-foreground">
            {m.admin_tools_page_header_desc()}
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="hidden sm:flex h-11 px-8 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-all font-mono text-[11px] uppercase tracking-[0.2em] font-medium disabled:opacity-50 shadow-lg shadow-foreground/5"
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin mr-3" />
          ) : (
            <Check size={14} className="mr-3" />
          )}
          {isSubmitting ? m.admin_tools_page_btn_saving() : m.admin_tools_page_btn_save()}
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {m.settings_site_field_tools_page_title()}
          </label>
          <p className="text-xs text-muted-foreground">
            {m.settings_site_field_tools_page_title_hint()}
          </p>
          <Input
            {...register("tools_page_title")}
            placeholder={m.settings_site_field_tools_page_title_ph()}
            className={errors.tools_page_title ? "border-destructive" : ""}
          />
          {errors.tools_page_title && (
            <p className="text-xs text-destructive">{errors.tools_page_title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {m.settings_site_field_tools_page_desc()}
          </label>
          <p className="text-xs text-muted-foreground">
            {m.settings_site_field_tools_page_desc_hint()}
          </p>
          <Input
            {...register("tools_page_description")}
            placeholder={m.settings_site_field_tools_page_desc_ph()}
            className={errors.tools_page_description ? "border-destructive" : ""}
          />
          {errors.tools_page_description && (
            <p className="text-xs text-destructive">{errors.tools_page_description.message}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {m.settings_site_field_tools_page_content()}
          </label>
          <p className="text-xs text-muted-foreground">
            {m.settings_site_field_tools_page_content_hint()}
          </p>
          <Textarea
            {...register("tools_page_content")}
            placeholder={m.settings_site_field_tools_page_content_ph()}
            rows={12}
            className={errors.tools_page_content ? "border-destructive" : ""}
          />
          {errors.tools_page_content && (
            <p className="text-xs text-destructive">{errors.tools_page_content.message}</p>
          )}
        </div>
      </div>

      {/* Mobile Save Button */}
      {isDirty && (
        <div className="fixed bottom-8 right-6 z-50 sm:hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-14 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all shadow-2xl flex items-center justify-center p-0"
          >
            {isSubmitting ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Check size={24} />
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
