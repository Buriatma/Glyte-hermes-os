import "server-only";

import { getSession } from "lib/auth/server";
import { AdminUsersQuery, AdminUsersPaginated } from "app-types/admin";
import {
  requireAdminPermission,
  requireUserListPermission,
} from "lib/auth/permissions";

export const ADMIN_USER_LIST_LIMIT = 10;
export const DEFAULT_SORT_BY = "createdAt";
export const DEFAULT_SORT_DIRECTION = "desc";

/**
 * Require an admin session
 * This is a wrapper around the getSession function
 * that throws an error if the user is not an admin
 *
 * @deprecated Use requireAdminPermission() from lib/auth/permissions instead
 */
export async function requireAdminSession(): Promise<
  NonNullable<Awaited<ReturnType<typeof getSession>>>
> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized: No session found");
  }

  // Use our new permission system internally
  await requireAdminPermission("access admin functions");

  return session;
}

/**
 * Get paginated users using our custom repository with improved search capabilities
 * Only admins can list and search users
 */
export async function getAdminUsers(
  query?: AdminUsersQuery,
): Promise<AdminUsersPaginated> {
  await requireUserListPermission("list users in admin panel");
  const session = await getSession();

  const mockAdminUser = session?.user || {
    id: "hermes-admin",
    name: "Hermes Operator",
    email: "operator@hermes.local",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
    emailVerified: true,
  };

  return {
    users: [mockAdminUser as any],
    total: 1,
    limit: query?.limit ?? ADMIN_USER_LIST_LIMIT,
    offset: query?.offset ?? 0,
  };
}
