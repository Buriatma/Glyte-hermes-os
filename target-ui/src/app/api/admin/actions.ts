"use server";

import { validatedActionWithAdminPermission } from "lib/action-utils";
import {
  UpdateUserRoleSchema,
  UpdateUserRoleActionState,
  UpdateUserBanStatusSchema,
  UpdateUserBanStatusActionState,
} from "./validations";

export const updateUserRolesAction = validatedActionWithAdminPermission(
  UpdateUserRoleSchema,
  async (_data, _formData, _userSession): Promise<UpdateUserRoleActionState> => {
    return {
      success: true,
      message: "Role updated in Hermes OS",
    };
  },
);

export const updateUserBanStatusAction = validatedActionWithAdminPermission(
  UpdateUserBanStatusSchema,
  async (_data, _formData, _userSession): Promise<UpdateUserBanStatusActionState> => {
    return {
      success: true,
      message: "Status updated in Hermes OS",
    };
  },
);
