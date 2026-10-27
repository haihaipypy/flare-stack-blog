import * as UserRepo from "@/features/users/data/users.data";
import type {
  GetUsersInput,
  UserActionResult,
  UserIdInput,
  UserListResult,
} from "@/features/users/users.schema";

/**
 * 后台用户列表：分页 + 关键词搜索 + 状态筛选。
 * 只读查询，不走缓存 —— 每有新注册就该立刻可见。
 */
export async function getUsers(
  context: DbContext,
  input: GetUsersInput,
): Promise<UserListResult> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const filter = input.filter ?? "all";
  const search = input.search?.trim() || undefined;

  const [total, stats] = await Promise.all([
    UserRepo.getUsersCount(context.db, { search, filter }),
    UserRepo.getUsersStats(context.db),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // 页码越界（比如筛选后变少）时回落到最后一页而不是给个空表
  const safePage = Math.min(page, totalPages);

  const items = await UserRepo.getUsers(context.db, {
    search,
    filter,
    limit: pageSize,
    offset: (safePage - 1) * pageSize,
  });

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
    stats,
  };
}

/**
 * 重发验证邮件。
 *
 * 关键点：better-auth 的 `/send-verification-email` 在 `emailVerified === true`
 * 时直接 `return { status: true }`，**不会调用 sendVerificationEmail**
 * （node_modules/better-auth/dist/api/routes/email-verification.mjs:99-102）。
 * 所以后台点「重发」时必须先把标记落回 false，否则前端拿到成功、Resend 里一片空白。
 */
export async function resendVerificationEmail(
  context: AuthContext,
  input: UserIdInput,
): Promise<UserActionResult> {
  const user = await UserRepo.findUserById(context.db, input.id);
  if (!user) return { ok: false, reason: "USER_NOT_FOUND" };

  if (user.emailVerified) {
    await UserRepo.setEmailVerified(context.db, user.id, false);
  }

  try {
    await context.auth.api.sendVerificationEmail({
      body: { email: user.email },
    });
    return { ok: true };
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "admin resend verification failed",
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, reason: "SEND_FAILED" };
  }
}

/** 只把标记改成未验证，不发信 —— 用于修正历史脏数据 */
export async function markEmailUnverified(
  context: DbContext,
  input: UserIdInput,
): Promise<UserActionResult> {
  const user = await UserRepo.findUserById(context.db, input.id);
  if (!user) return { ok: false, reason: "USER_NOT_FOUND" };

  if (user.emailVerified) {
    await UserRepo.setEmailVerified(context.db, user.id, false);
  }

  return { ok: true };
}
