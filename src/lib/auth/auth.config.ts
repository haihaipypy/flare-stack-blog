import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";

export function createAuthConfig() {
  return {
    emailAndPassword: {
      enabled: true,
    },
    // 同一邮箱的 GitHub 账号与邮箱密码账号合并成一个用户：
    // 先密码注册、后用 GitHub 登录时自动关联，不会报 "account not linked"。
    // GitHub 返回的邮箱一定经过验证，所以放进 trustedProviders 是安全的。
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["github"],
      },
    },
    session: {
      storeSessionInDatabase: true,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    // Behind Cloudflare: read the real client IP from CF-Connecting-IP so
    // Better Auth rate limiting / IP tracking works instead of being skipped.
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
    plugins: [admin()],
  } satisfies BetterAuthOptions;
}
