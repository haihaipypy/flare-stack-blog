import * as AuthRepo from "@/features/auth/data/auth.data";
import * as ConfigService from "@/features/config/service/config.service";

export async function getSession(context: SessionContext) {
  return context.session;
}

export async function userHasPassword(context: AuthContext) {
  return await AuthRepo.userHasPassword(context.db, context.session.user.id);
}

/**
 * 给「只有第三方登录、没有密码」的账号补一个密码。
 *
 * better-auth 的 `setPassword` 端点没有注册 HTTP 路由（线上 /api/auth/set-password
 * 是 404），只能服务端调 `auth.api`，所以这里包一层 serverFn 给前端用。
 * 已有密码的账号会抛 PASSWORD_ALREADY_SET，前端按 hasPassword 分支不会走到这里。
 */
export async function setPassword(
  context: AuthContext,
  input: { newPassword: string },
  headers: Headers,
): Promise<{ ok: true } | { ok: false; code?: string }> {
  try {
    await context.auth.api.setPassword({
      body: { newPassword: input.newPassword },
      headers,
    });
    return { ok: true };
  } catch (error) {
    // 把 APIError 的 code 原样交给前端，走已有的错误文案映射，
    // 避免直接把 "PASSWORD_ALREADY_SET" 这种英文码弹给用户。
    return { ok: false, code: extractAuthErrorCode(error) };
  }
}

function extractAuthErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const withBody = error as { body?: { code?: unknown }; code?: unknown };
  if (typeof withBody.body?.code === "string") return withBody.body.code;
  if (typeof withBody.code === "string") return withBody.code;
  return undefined;
}

export async function getIsEmailConfigured(
  context: DbContext & { executionCtx: ExecutionContext },
) {
  const config = await ConfigService.getSystemConfig(context);
  return !!(
    config?.email?.host &&
    config.email.username &&
    config.email.password &&
    config.email.senderAddress
  );
}
