import { cookies } from "next/headers";
import { BasicUser } from "app-types/user";

export const HERMES_OPERATOR: BasicUser = {
  id: "hermes-operator",
  name: "Hermes Operator",
  email: "operator@hermes.local",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Single-user authentication matching HERMES_WEBUI_PASSWORD.
 * Eliminates all external database models, drizzle, PostgreSQL, and multi-tenant schema.
 */
export async function getSession(): Promise<{ user: BasicUser } | null> {
  const expectedPassword = process.env.HERMES_WEBUI_PASSWORD;

  // If no password configured, grant operator access automatically
  if (!expectedPassword) {
    return { user: HERMES_OPERATOR };
  }

  // Check cookie against expected password
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hermes_auth_token")?.value;
    if (token === expectedPassword) {
      return { user: HERMES_OPERATOR };
    }
  } catch (e) {
    // In environments where cookies() cannot be read synchronously
  }

  return null;
}

export async function getIsFirstUser(): Promise<boolean> {
  return false;
}

export const auth = {
  api: {
    getSession,
  },
};
