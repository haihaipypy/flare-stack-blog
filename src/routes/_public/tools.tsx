import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { affiliatePublicConfigQuery } from "@/features/affiliate/queries";
import { siteConfigQuery } from "@/features/config/queries";

export const Route = createFileRoute("/_public/tools")({
  component: RouteComponent,
  loader: async ({ context }) => {
    // 广告位配置与站点配置一起预取，SSR 时 AffiliateSlot 才能直接拿到
    const [siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(siteConfigQuery),
      context.queryClient.ensureQueryData(affiliatePublicConfigQuery),
    ]);
    return {
      title: siteConfig.tools_page_title,
      description: siteConfig.tools_page_description,
      content: siteConfig.tools_page_content,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
  }),
  pendingComponent: theme.ToolsPageSkeleton,
});

function RouteComponent() {
  const { data: siteConfig } = useSuspenseQuery(siteConfigQuery);
  return (
    <theme.ToolsPage
      title={siteConfig.tools_page_title}
      description={siteConfig.tools_page_description}
      content={siteConfig.tools_page_content}
    />
  );
}
