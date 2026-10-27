import { createServerFn } from "@tanstack/react-start";
import {
  GetUsersInputSchema,
  UserIdInputSchema,
} from "@/features/users/users.schema";
import * as UserService from "@/features/users/users.service";
import { adminMiddleware } from "@/lib/middlewares";

export const getUsersFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(GetUsersInputSchema)
  .handler(async ({ data, context }) => {
    return await UserService.getUsers(context, data);
  });

/** 重发验证邮件（若已标记验证会先落回未验证，否则 better-auth 会静默跳过发信） */
export const resendUserVerificationFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(UserIdInputSchema)
  .handler(async ({ data, context }) => {
    return await UserService.resendVerificationEmail(context, data);
  });

/** 仅把 email_verified 改回 false，不发信 */
export const markUserUnverifiedFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(UserIdInputSchema)
  .handler(async ({ data, context }) => {
    return await UserService.markEmailUnverified(context, data);
  });
