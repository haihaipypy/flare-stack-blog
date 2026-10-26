import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { UserList } from "@/features/users/components/user-list";
import { USER_FILTERS } from "@/features/users/users.schema";
import { m } from "@/paraglide/messages";

const searchSchema = z.object({
  filter: z.enum(USER_FILTERS).optional().default("all").catch("all"),
  search: z.string().optional().catch(undefined),
  page: z.number().optional().default(1).catch(1),
});

export const Route = createFileRoute("/admin/users/")({
  ssr: false,
  validateSearch: searchSchema,
  component: UsersAdminPage,
  loader: () => {
    return {
      title: m.users_admin_title(),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});

function UsersAdminPage() {
  const { filter, search, page } = Route.useSearch();

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-border/30 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">
            {m.users_admin_title()}
          </h1>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
            {m.users_admin_tag()}
          </p>
        </div>
      </div>

      <UserList filter={filter} search={search} page={page} />
    </div>
  );
}
