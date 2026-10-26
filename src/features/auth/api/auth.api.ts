import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import * as AuthService from "@/features/auth/service/auth.service";
import {
  authMiddleware,
  dbMiddleware,
  sessionMiddleware,
} from "@/lib/middlewares";

export const getSessionFn = createServerFn()
  .middleware([sessionMiddleware])
  .handler(({ context }) => AuthService.getSession(context));

export const userHasPasswordFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => await AuthService.userHasPassword(context));

const SetPasswordInputSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export const setPasswordFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(SetPasswordInputSchema)
  .handler(async ({ data, context }) =>
    AuthService.setPassword(context, data, getRequestHeaders()),
  );

export const getIsEmailConfiguredFn = createServerFn()
  .middleware([dbMiddleware])
  .handler(({ context }) => AuthService.getIsEmailConfigured(context));
