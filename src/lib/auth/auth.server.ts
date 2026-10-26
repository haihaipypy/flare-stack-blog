import { createAuthMiddleware } from "@better-auth/core/api";
import { APIError } from "@better-auth/core/error";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthEmail } from "@/features/email/templates/AuthEmail";
import { createAuthConfig } from "@/lib/auth/auth.config";
import * as authSchema from "@/lib/db/schema/auth.table";
import { serverEnv } from "@/lib/env/server.env";
import type { Locale } from "@/lib/i18n";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

/** 日志里不留完整邮箱，避免日志被导出时泄露用户信息 */
function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${email.slice(at + 1)}`;
}

function logAuthEvent(
  level: "info" | "warn" | "error",
  message: string,
  detail: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({ scope: "auth", message, ...detail });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

async function checkEmailRateLimit(
  env: Env,
  scope: string,
  email: string,
): Promise<boolean> {
  const identifier = `${scope}:${email.toLowerCase().trim()}`;
  const id = env.RATE_LIMITER.idFromName(identifier);
  const rateLimiter = env.RATE_LIMITER.get(id);
  const result = await rateLimiter.checkLimit({
    capacity: 3,
    interval: "1h",
  });
  if (!result.allowed) {
    // 原来这里直接 return，邮件被丢掉但没有任何痕迹，排查时无从下手
    logAuthEvent("warn", "email rate limited", {
      scope,
      to: maskEmail(email),
    });
  }
  return result.allowed;
}

/** 生成验证邮件 HTML 并投递到队列；失败时留下明确日志 */
async function enqueueVerificationEmail(
  env: Env,
  params: { to: string; url: string; locale: Locale },
): Promise<void> {
  try {
    const emailHtml = renderToStaticMarkup(
      AuthEmail({
        locale: params.locale,
        type: "verification",
        url: params.url,
      }),
    );

    await env.QUEUE.send({
      type: "EMAIL",
      data: {
        to: params.to,
        subject: m.email_auth_verification_subject(
          {},
          { locale: params.locale },
        ),
        html: emailHtml,
      },
    });

    logAuthEvent("info", "verification email enqueued", {
      to: maskEmail(params.to),
    });
  } catch (error) {
    logAuthEvent("error", "verification email enqueue failed", {
      to: maskEmail(params.to),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function getAuth({ db, env }: { db: DB; env: Env }) {
  const {
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    ADMIN_EMAIL,
    LOCALE,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
  } = serverEnv(env);

  // 固定 10 个 DO 实例池，随机选择避免冷启动
  const PASSWORD_HASHER_POOL_SIZE = 10;
  function getPasswordHasher() {
    const index = Math.floor(Math.random() * PASSWORD_HASHER_POOL_SIZE);
    const id = env.PASSWORD_HASHER.idFromName(`hasher-${index}`);
    return env.PASSWORD_HASHER.get(id);
  }

  function getAuthEmailLocale(): Locale {
    try {
      return getLocale();
    } catch {
      return LOCALE;
    }
  }

  // betterAuth() 构造完成后才有 api，而 onExistingUserSignUp 里要用
  // auth.api.sendVerificationEmail 走官方的「生成 token + 发信」流程，
  // 所以先留一个引用，构造完立刻回填。
  let authRef:
    | {
        api: {
          sendVerificationEmail: (input: {
            body: { email: string; callbackURL?: string };
          }) => Promise<unknown>;
        };
      }
    | undefined;

  const auth = betterAuth({
    ...createAuthConfig(),
    socialProviders: {
      github: {
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return;

        const email =
          typeof ctx.body?.email === "string" ? ctx.body.email.trim() : "";
        if (!email) return;

        const allowed = await checkEmailRateLimit(env, "email-signup", email);
        if (allowed) return;

        throw APIError.from("BAD_REQUEST", {
          code: "RATE_LIMITED",
          message: "Too many sign up attempts",
        });
      }),
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      password: {
        hash: (password: string) => getPasswordHasher().hash(password),
        verify: (params: { hash: string; password: string }) =>
          getPasswordHasher().verify(params),
      },
      // requireEmailVerification 下，已存在的邮箱会返回一个「假成功」响应
      // （防枚举）。这里接手这个分支：只有「已注册但还没验证」的账号才补发
      // 验证邮件 —— 已验证的直接跳过，所以对外仍然看不出邮箱是否存在。
      onExistingUserSignUp: async ({ user }) => {
        if (user.emailVerified) {
          logAuthEvent("info", "duplicate sign-up ignored (already verified)", {
            to: maskEmail(user.email),
          });
          return;
        }

        logAuthEvent("info", "duplicate sign-up: resending verification", {
          to: maskEmail(user.email),
        });

        try {
          // 走官方端点：会重新生成 token，并回调下面的 sendVerificationEmail
          await authRef?.api.sendVerificationEmail({
            body: { email: user.email },
          });
        } catch (error) {
          logAuthEvent("error", "duplicate sign-up resend failed", {
            to: maskEmail(user.email),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
      sendResetPassword: async ({ user, url }) => {
        // Per-email rate limit: 3 per hour
        const allowed = await checkEmailRateLimit(
          env,
          "email-reset",
          user.email,
        );
        if (!allowed) return;

        try {
          const locale = getAuthEmailLocale();
          const emailHtml = renderToStaticMarkup(
            AuthEmail({ locale, type: "reset-password", url }),
          );

          await env.QUEUE.send({
            type: "EMAIL",
            data: {
              to: user.email,
              subject: m.email_auth_reset_subject({}, { locale }),
              html: emailHtml,
            },
          });

          logAuthEvent("info", "reset email enqueued", {
            to: maskEmail(user.email),
          });
        } catch (error) {
          logAuthEvent("error", "reset email enqueue failed", {
            to: maskEmail(user.email),
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },
    },
    emailVerification: {
      // 显式声明：注册即发验证邮件，不再依赖 requireEmailVerification 兜底
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        // Per-email rate limit: 3 per hour
        const allowed = await checkEmailRateLimit(
          env,
          "email-verify",
          user.email,
        );
        if (!allowed) return;

        await enqueueVerificationEmail(env, {
          to: user.email,
          url,
          locale: getAuthEmailLocale(),
        });
      },
      autoSignInAfterVerification: true,
    },
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (user.email === ADMIN_EMAIL) {
              return { data: { ...user, role: "admin" } };
            }
            return { data: user };
          },
        },
      },
    },
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
  });

  authRef = auth as unknown as typeof authRef;

  return auth;
}

export type Auth = ReturnType<typeof getAuth>;
export type Session = Auth["$Infer"]["Session"];
