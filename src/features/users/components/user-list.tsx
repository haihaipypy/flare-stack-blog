import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { AlertTriangle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Input } from "@/components/ui/input";
import {
  avatarSeedForUser,
  buildAvatarUrl,
} from "@/features/avatar/avatar.url";
import {
  markUserUnverifiedFn,
  resendUserVerificationFn,
} from "@/features/users/api/users.api";
import { USERS_KEYS, usersQueryOptions } from "@/features/users/queries";
import type {
  UserFilter,
  UserListItem,
  UserStats,
} from "@/features/users/users.schema";
import { cn, formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";

const PAGE_SIZE = 20;
const routeApi = getRouteApi("/admin/users/");

const FILTERS: Array<{ key: UserFilter; label: () => string }> = [
  { key: "all", label: () => m.users_filter_all() },
  { key: "verified", label: () => m.users_filter_verified() },
  { key: "unverified", label: () => m.users_filter_unverified() },
  { key: "admin", label: () => m.users_filter_admin() },
];

export function UserList({
  filter,
  search,
  page,
}: {
  filter: UserFilter;
  search?: string;
  page: number;
}) {
  const navigate = routeApi.useNavigate();
  const [searchInput, setSearchInput] = useState(search ?? "");

  // 输入停顿 400ms 再改 URL，避免每敲一个字都发一次请求
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim() || undefined;
      if (next === search) return;
      navigate({
        search: (prev) => ({ ...prev, search: next, page: 1 }),
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, search, navigate]);

  const { data, isLoading, isError } = useQuery(
    usersQueryOptions({
      page,
      pageSize: PAGE_SIZE,
      filter,
      search,
    }),
  );

  const handleFilterChange = (next: UserFilter) => {
    navigate({
      search: (prev) => ({ ...prev, filter: next, page: 1 }),
    });
  };

  return (
    <div className="space-y-6">
      <StatsBar stats={data?.stats} loading={isLoading} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
        <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleFilterChange(item.key)}
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] whitespace-nowrap font-mono transition-colors",
                filter === item.key
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === item.key ? `[ ${item.label()} ]` : item.label()}
            </button>
          ))}
        </nav>

        <Input
          placeholder={m.users_admin_search()}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="h-9 w-full sm:w-64 border-b border-border/50 bg-transparent rounded-none font-mono text-xs focus:border-foreground transition-all"
        />
      </div>

      {isError ? (
        <div className="flex items-center gap-3 border border-destructive/30 bg-destructive/5 px-4 py-6 text-xs font-mono text-destructive">
          <AlertTriangle size={14} />
          {m.users_load_error()}
        </div>
      ) : isLoading ? (
        <div className="space-y-2 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/30">
                <th className="py-3 pr-4 text-left text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  {m.users_col_user()}
                </th>
                <th className="hidden sm:table-cell py-3 pr-4 text-left text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  {m.users_col_role()}
                </th>
                <th className="py-3 pr-4 text-left text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  {m.users_col_status()}
                </th>
                <th className="hidden md:table-cell py-3 text-right text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  {m.users_col_joined()}
                </th>
                <th className="py-3 text-right text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  {m.users_col_actions()}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <UserRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>

          <AdminPagination
            currentPage={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            itemsPerPage={data.pageSize}
            currentPageItemCount={data.items.length}
            onPageChange={(nextPage) =>
              navigate({ search: (prev) => ({ ...prev, page: nextPage }) })
            }
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-muted-foreground">
          <UserRound size={22} strokeWidth={1.25} />
          <p className="text-xs font-mono">{m.users_empty()}</p>
        </div>
      )}
    </div>
  );
}

function UserRow({ item }: { item: UserListItem }) {
  const isAdmin = item.role === "admin";

  return (
    <tr className="border-b border-border/20 hover:bg-muted/20 transition-colors">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={buildAvatarUrl(avatarSeedForUser(item), { size: 64 })}
            alt=""
            loading="lazy"
            className="size-8 shrink-0 border border-border/30 object-cover"
          />
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm text-foreground">
              {item.name}
            </span>
            <span className="truncate text-[10px] font-mono text-muted-foreground">
              {item.email}
            </span>
          </div>
        </div>
      </td>

      <td className="hidden sm:table-cell py-3 pr-4">
        <span
          className={cn(
            "inline-block border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider",
            isAdmin
              ? "border-foreground/40 text-foreground"
              : "border-border/40 text-muted-foreground",
          )}
        >
          {isAdmin ? m.users_role_admin() : m.users_role_user()}
        </span>
      </td>

      <td className="py-3 pr-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-mono",
            item.emailVerified ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              item.emailVerified ? "bg-emerald-500" : "bg-muted-foreground/40",
            )}
          />
          {item.emailVerified
            ? m.users_status_verified()
            : m.users_status_pending()}
        </span>
      </td>

      <td className="hidden md:table-cell py-3 pr-4 text-right text-[10px] font-mono text-muted-foreground whitespace-nowrap">
        {formatDate(item.createdAt)}
      </td>

      <td className="py-3">
        <UserActions item={item} />
      </td>
    </tr>
  );
}

function UserActions({ item }: { item: UserListItem }) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: USERS_KEYS.all });

  const resend = useMutation({
    mutationFn: () => resendUserVerificationFn({ data: { id: item.id } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(m.users_toast_resend_ok());
        void invalidate();
      } else {
        toast.error(m.users_toast_resend_failed());
      }
    },
    onError: (error) =>
      toast.error(m.users_toast_resend_failed(), {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  const unverify = useMutation({
    mutationFn: () => markUserUnverifiedFn({ data: { id: item.id } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(m.users_toast_unverify_ok());
        void invalidate();
      } else {
        toast.error(m.users_toast_action_failed());
      }
    },
    onError: () => toast.error(m.users_toast_action_failed()),
  });

  const buttonClass =
    "border border-border/50 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground disabled:opacity-40 disabled:hover:border-border/50 disabled:hover:text-muted-foreground";

  return (
    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
      <button
        type="button"
        disabled={resend.isPending}
        onClick={() => resend.mutate()}
        className={buttonClass}
      >
        {m.users_action_resend()}
      </button>

      {item.emailVerified ? (
        <button
          type="button"
          disabled={unverify.isPending}
          onClick={() => unverify.mutate()}
          className={buttonClass}
        >
          {m.users_action_unverify()}
        </button>
      ) : null}
    </div>
  );
}

function StatsBar({ stats, loading }: { stats?: UserStats; loading: boolean }) {
  const items = [
    { key: "total", label: m.users_stat_total(), value: stats?.total },
    { key: "verified", label: m.users_stat_verified(), value: stats?.verified },
    {
      key: "unverified",
      label: m.users_stat_unverified(),
      value: stats?.unverified,
    },
    { key: "admins", label: m.users_stat_admin(), value: stats?.admins },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 border border-border/30">
      {items.map((item) => (
        <div key={item.key} className="bg-background px-4 py-3">
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-xl font-serif tabular-nums">
            {loading ? "—" : (item.value ?? 0)}
          </p>
        </div>
      ))}
    </div>
  );
}
