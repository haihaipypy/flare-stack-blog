import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";

export function createAuthConfig() {
  return {
    emailAndPassword: {
      enabled: true,
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
