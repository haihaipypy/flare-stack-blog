import { createServerFn } from "@tanstack/react-start";
import { GetUsersInputSchema } from "@/features/users/users.schema";
import * as UserService from "@/features/users/users.service";
import { adminMiddleware } from "@/lib/middlewares";

export const getUsersFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(GetUsersInputSchema)
  .handler(async ({ data, context }) => {
    return await UserService.getUsers(context, data);
  });
