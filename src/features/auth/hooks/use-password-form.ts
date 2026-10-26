import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AUTH_KEYS } from "@/features/auth/queries";
import { authClient } from "@/lib/auth/auth.client";
import { getPasswordAuthErrorMessage } from "@/lib/auth/auth-errors";
import type { Messages } from "@/lib/i18n";
import { m } from "@/paraglide/messages";
import { setPasswordFn } from "../api/auth.api";

/**
 * - `change`：账号已经有密码（credential account），需要校验当前密码
 * - `set`：账号只有 GitHub 等第三方登录，没有密码，直接设置即可
 */
export type PasswordMode = "set" | "change";

const createPasswordSchema = (
  messages: Messages,
  getMode: () => PasswordMode,
) =>
  z
    .object({
      currentPassword: z.string().optional(),
      newPassword: z
        .string()
        .min(8, messages.profile_validation_new_password_min()),
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      if (getMode() === "change" && !data.currentPassword?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["currentPassword"],
          message: messages.profile_validation_current_password_required(),
        });
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: messages.profile_validation_password_mismatch(),
        });
      }
    });

type PasswordSchema = z.infer<ReturnType<typeof createPasswordSchema>>;

export interface UsePasswordFormOptions {
  /** 账号是否已经有密码（由 userHasPasswordFn 查询得到） */
  hasPassword: boolean;
}

export function usePasswordForm(options: UsePasswordFormOptions) {
  const mode: PasswordMode = options.hasPassword ? "change" : "set";
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  // resolver 只在首次挂载时创建，但它依赖 mode（决定当前密码是否必填）。
  // 用 ref 承载最新值，避免 hasPassword 变化后仍按旧的必填规则校验。
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const resolver = useMemo(
    () =>
      standardSchemaResolver(createPasswordSchema(m, () => modeRef.current)),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordSchema>({
    resolver,
  });

  const onSubmit = async (data: PasswordSchema) => {
    if (mode === "set") {
      // 没有密码的账号（GitHub 注册）走 serverFn，因为 better-auth 的
      // setPassword 端点没注册成 HTTP 路由，客户端直接调会 404。
      let result: Awaited<ReturnType<typeof setPasswordFn>>;
      try {
        result = await setPasswordFn({
          data: { newPassword: data.newPassword },
        });
      } catch {
        // serverFn 本身失败（网络、session 过期等），也要给个明确提示，
        // 不能让异常静默冒到控制台。
        toast.error(m.profile_toast_update_failed(), {
          description: m.auth_error_default_desc(),
        });
        return;
      }

      if (!result.ok) {
        toast.error(m.profile_toast_update_failed(), {
          description:
            getPasswordAuthErrorMessage({ code: result.code }, m) ??
            m.auth_error_default_desc(),
        });
        return;
      }

      toast.success(m.profile_toast_password_set(), {
        // 邮箱未验证时，requireEmailVerification 会拦住密码登录，
        // 所以在成功提示里就把话说清楚，别让用户去登录页撞一遍。
        description:
          session?.user?.emailVerified === false
            ? m.profile_toast_password_set_unverified()
            : m.profile_toast_password_set_desc(),
      });
      // 密码建好后卡片要立刻从「设置密码」切成「修改密码」，
      // 否则再点一次会命中 PASSWORD_ALREADY_SET。
      await queryClient.invalidateQueries({
        queryKey: AUTH_KEYS.hasPasswordRoot,
      });
      reset();
      return;
    }

    const { error } = await authClient.changePassword({
      newPassword: data.newPassword,
      currentPassword: data.currentPassword ?? "",
      revokeOtherSessions: true,
    });

    if (error) {
      toast.error(m.profile_toast_update_failed(), {
        description:
          getPasswordAuthErrorMessage(error, m) ?? m.auth_error_default_desc(),
      });
      return;
    }

    toast.success(m.profile_toast_password_updated(), {
      description: m.profile_toast_security_synced(),
    });
    reset();
  };

  return {
    mode,
    register,
    errors,
    handleSubmit: handleSubmit(onSubmit),
    isSubmitting,
  };
}

export type UsePasswordFormReturn = ReturnType<typeof usePasswordForm>;
