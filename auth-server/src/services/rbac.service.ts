import { eq, sql, inArray, and, asc } from "drizzle-orm";
import { drizzleClient as db } from "../db/client";
import {
  roles,
  userRoles,
  rolePermissions,
  permissions,
  userPermissions,
} from "../db/schemas/rbac";
import { alias } from "drizzle-orm/pg-core";
import {
  PermissionInsert,
  PermissionUpdate,
  RoleInsert,
  RoleUpdate,
} from "@/db/schemas/auth.schema";

export class RbacService {
  /**
   * Resolves all roles for a user, including inherited roles.
   * Uses a Recursive CTE for high performance (single DB roundtrip).
   *
   * Logic:
   * 1. Start with roles directly assigned to the user.
   * 2. Recursively find parent roles (following roles.parentId).
   * 3. Return a flat list of all applicable roles, sorted by priority (order).
   *
   * @param userId The ID of the user to resolve roles for.
   * @returns Array of role objects with { id, name, value, order }.
   */
  static async resolveUserRoles(userId: string) {
    // Define the recursive CTE
    // Note: Drizzle's CTE support for recursive queries needs raw SQL for the recursive part usually,
    // or careful construction. We'll use sql template for the recursive part to ensure correctness and cycle detection.

    /*
            WITH RECURSIVE role_hierarchy AS (
                -- Base Case: Direct User Roles
                SELECT r.*, 1 as depth
                FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = ${userId} AND r.is_active = true

                UNION

                -- Recursive Step: Parent Roles
                SELECT r.*, rh.depth + 1
                FROM roles r
                JOIN role_hierarchy rh ON r.id = rh.parent_id
                WHERE r.is_active = true AND rh.depth < 10 -- Safety break for cycles
            )
            SELECT DISTINCT * FROM role_hierarchy ORDER BY "order" ASC;
        */

    const result = await db.execute(sql`
            WITH RECURSIVE role_hierarchy AS (
                -- Base Case: Direct User Roles
                SELECT 
                    r.id, 
                    r.name, 
                    r.value, 
                    r.description, 
                    r.is_active, 
                    r.parent_id, 
                    r."order",
                    1 as depth,
                    ARRAY[r.id] as path -- Path tracking for cycle detection
                FROM ${roles} r
                JOIN ${userRoles} ur ON r.id = ur.role_id
                WHERE ur.user_id = ${userId} AND r.is_active = true

                UNION

                -- Recursive Step: Parent Roles
                SELECT 
                    parent.id, 
                    parent.name, 
                    parent.value, 
                    parent.description, 
                    parent.is_active, 
                    parent.parent_id, 
                    parent."order",
                    rh.depth + 1,
                    rh.path || parent.id
                FROM ${roles} parent
                JOIN role_hierarchy rh ON parent.id = rh.parent_id
                WHERE 
                    parent.is_active = true 
                    AND NOT (parent.id = ANY(rh.path)) -- Cycle detection: Stop if we've seen this ID in the path
            )
            SELECT DISTINCT ON (id) * FROM role_hierarchy ORDER BY id, "order" ASC;
        `);

    // Sort by order in JS to be safe (though SQL can do it, DISTINCT ON needs matching ORDER BY)
    // We want the final list sorted by priority (order asc)
    const allRoles = result.rows
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        value: row.value as string,
        description: row.description as string,
        order: row.order as number,
      }))
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    return allRoles;
  }

  /**
   * Resolves all permissions for a user, including those from:
   * 1. Direct user permissions
   * 2. Permissions from all resolved roles (direct + inherited)
   *
   * @param userId The ID of the user.
   * @returns Array of unique permission values (e.g., ["user:read", "post:create"]).
   */
  static async resolveUserPermissions(userId: string) {
    // 1. Get all roles (including inherited)
    const allRoles = await this.resolveUserRoles(userId);
    const roleIds = allRoles.map((r) => r.id);

    if (roleIds.length === 0) {
      // Even if no roles, check direct permissions
      const directPerms = await db
        .select({ value: permissions.value })
        .from(userPermissions)
        .innerJoin(
          permissions,
          eq(userPermissions.permissionId, permissions.id),
        )
        .where(eq(userPermissions.userId, userId));

      return directPerms.map((p) => p.value);
    }

    // 2. Fetch permissions for these roles AND direct user permissions in one go
    // We can do this with a UNION of two queries

    const rolePermissionsQuery = db
      .select({ value: permissions.value })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    const userPermissionsQuery = db
      .select({ value: permissions.value })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    const [rolePerms, userPerms] = await Promise.all([
      rolePermissionsQuery,
      userPermissionsQuery,
    ]);

    // Merge and deduplicate
    const allPermissionValues = new Set([
      ...rolePerms.map((p) => p.value),
      ...userPerms.map((p) => p.value),
    ]);

    return Array.from(allPermissionValues);
  }

  /**
   * Assigns a role to a user by role value.
   * Safe: Ignores if role doesn't exist or is already assigned.
   */
  static async assignRole(userId: string, roleValue: string) {
    try {
      // 1. Find role by value
      const role = await db.query.roles.findFirst({
        where: eq(roles.value, roleValue),
      });

      if (!role) {
        console.warn(
          `Role '${roleValue}' not found. Skipping assignment for user ${userId}.`,
        );
        return;
      }

      // 2. Assign to user
      await db
        .insert(userRoles)
        .values({ userId, roleId: role.id })
        .onConflictDoNothing();

      console.log(`Assigned role '${roleValue}' to user ${userId}`);
    } catch (error) {
      console.error(
        `Failed to assign role ${roleValue} to user ${userId}:`,
        error,
      );
    }
  }

  static async listRoles() {
    const roles = await db.query.roles.findMany();
    return roles;
  }

  static async createRole(rolesPayload: RoleInsert[]) {
    const newRole = await db.insert(roles).values(rolesPayload).returning();
    return newRole[0];
  }
  static async deleteRole(roleId: string) {
    await db.delete(roles).where(eq(roles.id, roleId));
  }

  static async updateRole(roleId: string, rolePayload: RoleUpdate) {
    await db.update(roles).set(rolePayload).where(eq(roles.id, roleId));
  }

  // Permissions
  static async listPermissions() {
    const permissions = await db.query.permissions.findMany();
    return permissions;
  }

 static async createPermission(permissionPayload: PermissionInsert[]) {
    const newPermission = await db
      .insert(permissions)
      .values(permissionPayload)
      .returning();
    return newPermission[0];
  }

  static async deletePermission(permissionId: string) {
    await db.delete(permissions).where(eq(permissions.id, permissionId));
  }

  static async updatePermission(
    permissionId: string,
    permissionPayload: PermissionUpdate,
  ) {
    await db
      .update(permissions)
      .set(permissionPayload)
      .where(eq(permissions.id, permissionId));
  }

  static async assignRolePermission(roleId: string, permissionId: string) {
    await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .onConflictDoNothing();
  }

  static async assignUserPermission(userId: string, permissionId: string) {
    await db
      .insert(userPermissions)
      .values({ userId, permissionId })
      .onConflictDoNothing();
  }

  static async deleteRolePermission(roleId: string, permissionId: string) {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId),
        ),
      );
  }

  static async deleteUserPermission(userId: string, permissionId: string) {
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId),
        ),
      );
  }


  static async getRolePermissions(roleId: string) {
   return  db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, roleId),
    });

  }

  static async getUserPermissions(userId: string) {
    return db.query.userPermissions.findMany({
      where: eq(userPermissions.userId, userId),
    });
  }

  /**
   * Check if a user has the required roles (at least one).
   */
  static hasRoles(
    userRoles: string[] | undefined,
    requiredRoles: string[],
  ): boolean {
    if (!userRoles) return false;
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * Check if a user has the required permissions (all of them).
   */
  static hasPermissions(
    userPermissions: string[] | undefined,
    requiredPermissions: string[],
  ): boolean {
    if (!userPermissions) return false;
    return requiredPermissions.every((perm) => userPermissions.includes(perm));
  }
}
