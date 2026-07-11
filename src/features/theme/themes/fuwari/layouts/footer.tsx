import { ClientOnly, useRouteContext } from "@tanstack/react-router";
import type { NavOption } from "@/features/theme/contract/layouts";
import { m } from "@/paraglide/messages";

interface FooterProps {
  navOptions: Array<NavOption>;
}

export function Footer(_: FooterProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="border-t border-black/10 dark:border-white/15 my-10 border-dashed mx-4 md:mx-32" />
      <div className="fuwari-footer border-dashed border-black/10 dark:border-white/15 rounded-2xl mb-12 flex flex-col items-center justify-center px-6 py-8 gap-2">

        {/* 版权 */}
        <div className="fuwari-text-50 text-sm text-center">
          <ClientOnly fallback="-">
            {m.footer_copyright({
              year: currentYear.toString(),
              author: siteConfig.author,
            })}
          </ClientOnly>
        </div>

        {/* 导航链接：关于 · 隐私政策 · 服务条款 */}
        <div className="fuwari-text-50 text-sm text-center flex flex-wrap items-center justify-center gap-x-1">
          <a
            href="/post/about"
            className="fuwari-expand-animation rounded-md px-1 -m-1 font-medium hover:text-(--fuwari-primary) text-(--fuwari-primary)"
          >
            关于我们
          </a>
          <span className="opacity-30">·</span>
          <a
            href="/post/Privacy"
            className="fuwari-expand-animation rounded-md px-1 -m-1 font-medium hover:text-(--fuwari-primary) text-(--fuwari-primary)"
          >
            隐私政策
          </a>
          <span className="opacity-30">·</span>
          <a
            href="/post/Service"
            className="fuwari-expand-animation rounded-md px-1 -m-1 font-medium hover:text-(--fuwari-primary) text-(--fuwari-primary)"
          >
            服务条款
          </a>
        </div>

        {/* 次要信息：RSS / Sitemap / Powered by（降级展示） */}
        <div className="fuwari-text-50 text-xs text-center opacity-50 flex flex-wrap items-center justify-center gap-x-1 mt-1">
          <a
            href="/rss.xml"
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-80"
          >
            RSS
          </a>
          <span>·</span>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-80"
          >
            Sitemap
          </a>
          <span>·</span>
          <span>
            {m.footer_powered_by()}{" "}
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80"
            >
              Tanstack Start
            </a>
            {" & "}
            <a
              href="https://github.com/haihaipypy"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80"
            >
              Flare Stack Blog
            </a>
          </span>
        </div>

      </div>
    </>
  );
}
