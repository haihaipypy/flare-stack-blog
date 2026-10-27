import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import type { UserListItem, UserStats } from "@/features/users/users.schema";
import { user as UserTable } from "@/lib/db/schema";

function buildWhere(input: {
  search?: string;
  filter: "all" | "verified" | "unverified" | "admin";
}) {
  const conditions = [];

  if (input.filter === "verified") {
    conditions.push(eq(UserTable.emailVerified, true));
  } else if (input.filter === "unverified") {
    conditions.push(eq(UserTable.emailVerified, false));
  } else if (input.filter === "admin") {
    conditions.push(eq(UserTable.role, "admin"));
  }

  if (input.search) {
    const pattern = `%${input.search}%`;
    const keyword = or(
      like(UserTable.name, pattern),
      like(UserTable.email, pattern),
    );
    if (keyword) conditions.push(keyword);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getUsersCount(
  db: DB,
  input: {
    search?: string;
    filter: "all" | "verified" | "unverified" | "admin";
  },
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(UserTable)
    .where(buildWhere(input));

  return Number(row?.value ?? 0);
}

export async function getUsers(
  db: DB,
  input: {
    search?: string;
    filter: "all" | "verified" | "unverified" | "admin";
    limit: number;
    offset: number;
  },
): Promise<UserListItem[]> {
  const rows = await db
    .select({
      id: UserTable.id,
      name: UserTable.name,
      email: UserTable.email,
      image: UserTable.image,
      emailVerified: UserTable.emailVerified,
      role: UserTable.role,
      banned: UserTable.banned,
      createdAt: UserTable.createdAt,
    })
    .from(UserTable)
    .where(buildWhere(input))
    .orderBy(desc(UserTable.createdAt))
    .limit(input.limit)
    .offset(input.offset);

  return rows.map((row) => ({
    ...row,
    banned: row.banned ?? false,
  }));
}

/** 一次聚合拿到四个口径的计数，避免四次 round-trip */ export async function getUsersStats(
  db: DB,
): Promise<UserStats> {
  const [row] = await db
    .select({
      total: count(),
      verified: sql<
        number | null
      >`sum(case when ${UserTable.emailVerified} = 1 then 1 else 0 end)`,
      admins: sql<
        number | null
      >`sum(case when ${UserTable.role} = 'admin' then 1 else 0 end)`,
    })
    .from(UserTable);

  const total = Number(row?.total ?? 0);
  const verified = Number(row?.verified ?? 0);

  return {
    total,
    verified,
    unverified: Math.max(total - verified, 0),
    admins: Number(row?.admins ?? 0),
  };
}

export async function findUserById(
  db: DB,
  id: string,
): Promise<{ id: string; email: string; emailVerified: boolean } | null> {
  const [row] = await db
    .select({
      id: UserTable.id,
      email: UserTable.email,
      emailVerified: UserTable.emailVerified,
    })
    .from(UserTable)
    .where(eq(UserTable.id, id))
    .limit(1);

  return row ?? null;
}

export async function setEmailVerified(
  db: DB,
  id: string,
  emailVerified: boolean,
): Promise<void> {
  await db
    .update(UserTable)
    .set({ emailVerified, updatedAt: new Date() })
    .where(eq(UserTable.id, id));
}
