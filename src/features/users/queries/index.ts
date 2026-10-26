import { queryOptions } from "@tanstack/react-query";
import { getUsersFn } from "@/features/users/api/users.api";
import type { GetUsersInput } from "@/features/users/users.schema";

export const USERS_KEYS = {
  all: ["users"] as const,
  lists: ["users", "list"] as const,
  list: (input: GetUsersInput) => ["users", "list", input] as const,
};

export function usersQueryOptions(input: GetUsersInput) {
  return queryOptions({
    queryKey: USERS_KEYS.list(input),
    queryFn: async () => await getUsersFn({ data: input }),
    staleTime: 30 * 1000,
  });
}
