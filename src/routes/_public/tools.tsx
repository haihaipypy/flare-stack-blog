import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import theme from "@theme";
import { m } from "@/paraglide/messages";
import { siteConfigQuery } from "@/features/config/queries";

export const Route = createFileRoute("/_public/tools")({
  component: ToolsPage,
  loader: async ({ context }) => {
    const siteConfig = await context.queryClient.ensureQueryData(siteConfigQuery);
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

function ToolsPage({ title, description, content }: { title: string; description: string; content: string }) {
  return <theme.ToolsPage title={title} description={description} content={content} />;
}
