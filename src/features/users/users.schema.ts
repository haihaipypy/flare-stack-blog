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
