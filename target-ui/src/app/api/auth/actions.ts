"use server";

import { BasicUser, UserZodSchema } from "app-types/user";
import { ActionState } from "lib/action-utils";

export async function existsByEmailAction(_email: string) {
  return false;
}

type SignUpActionResponse = ActionState & {
  user?: BasicUser;
};

export async function signUpAction(data: {
  email: string;
  name: string;
  password: string;
}): Promise<SignUpActionResponse> {
  const { success, data: parsedData } = UserZodSchema.safeParse(data);
  if (!success) {
    return {
      success: false,
      message: "Invalid data",
    };
  }
  return {
    success: true,
    message: "Single-user mode active. Please sign in with Hermes WebUI password.",
    user: {
      id: "hermes-operator",
      name: parsedData.name || "Hermes Operator",
      email: parsedData.email || "operator@hermes.local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}
