import { z } from "zod";

export const USER_FILTERS = ["all", "verified", "unverified", "admin"] as const;

export type UserFilter = (typeof USER_FILTERS)[number];

export const GetUsersInputSchema = z.object({
  page: z.number().int().min(1).optional().default(1).catch(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20).catch(20),
  search: z.string().trim().max(120).optional().catch(undefined),
  filter: z.enum(USER_FILTERS).optional().default("all").catch("all"),
});

export type GetUsersInput = z.infer<typeof GetUsersInputSchema>;

export const UserIdInputSchema = z.object({
  id: z.string().min(1),
});

export type UserIdInput = z.infer<typeof UserIdInputSchema>;

/** 后台对单个用户的操作结果：不抛错，交给前端按 reason 出文案 */
export type UserActionResult =
  | { ok: true }
  | { ok: false; reason: "USER_NOT_FOUND" | "SEND_FAILED" };

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  role: string | null;
  banned: boolean;
  createdAt: Date;
};

export type UserStats = {
  total: number;
  verified: number;
  unverified: number;
  admins: number;
};

export type UserListResult = {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: UserStats;
};
