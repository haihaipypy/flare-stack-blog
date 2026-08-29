import { createFileRoute } from "@tanstack/react-router";
import theme from "@theme";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/tools")({
  component: ToolsPage,
  loader: async () => {
    return {
      title: m.tools_page_title(),
      description: m.tools_page_desc(),
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

function ToolsPage() {
  return <theme.ToolsPage />;
}