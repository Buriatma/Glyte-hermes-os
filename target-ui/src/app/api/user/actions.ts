"use server";

import {
  validatedActionWithAdminPermission,
  validatedActionWithUserManagePermission,
} from "lib/action-utils";
import {
  UpdateUserDetailsSchema,
  DeleteUserSchema,
  UpdateUserPasswordSchema,
  UpdateUserActionState,
  DeleteUserActionState,
  UpdateUserPasswordActionState,
} from "./validations";
import { getUser, updateUserDetails } from "lib/user/server";

export const updateUserImageAction = validatedActionWithUserManagePermission(
  UpdateUserDetailsSchema.pick({ userId: true, image: true }),
  async (data, userId): Promise<UpdateUserActionState> => {
    await updateUserDetails({ userId, image: data.image ?? undefined });
    const user = await getUser(userId);
    return {
      success: true,
      message: "Avatar updated",
      user: user || undefined,
    };
  },
);

export const updateUserDetailsAction = validatedActionWithUserManagePermission(
  UpdateUserDetailsSchema,
  async (data, userId): Promise<UpdateUserActionState> => {
    await updateUserDetails({
      userId,
      name: data.name ?? undefined,
      email: data.email ?? undefined,
    });
    const user = await getUser(userId);
    return {
      success: true,
      message: "Details updated",
      user: user || undefined,
    };
  },
);

export const deleteUserAction = validatedActionWithAdminPermission(
  DeleteUserSchema,
  async (): Promise<DeleteUserActionState> => {
    return {
      success: true,
      message: "Cannot delete operator in single-user mode",
    };
  },
);

export const updateUserPasswordAction = validatedActionWithUserManagePermission(
  UpdateUserPasswordSchema,
  async (): Promise<UpdateUserPasswordActionState> => {
    return {
      success: true,
      message: "Password managed via HERMES_WEBUI_PASSWORD",
    };
  },
);
