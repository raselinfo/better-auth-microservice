# Role and Permission Management Architecture Plan

## Overview
This plan outlines the architecture for implementing a scalable Role and Permission management system within the existing Auth Microservice. The goal is to move from simple JSON-based permissions to a structured, relational RBAC (Role-Based Access Control) system that can be managed via the Admin Dashboard.

## Current State
- **User Table**: Contains a `role` column (string) and `permissions` column (text/json).
- **RBAC Plugin**: Currently implements a simple role-based check using a `role` table with a JSON `permissions` column.
- **Admin UI**: Manages roles and users but relies on the simplified schema.

## Proposed Architecture

### 1. Database Schema
We will adopt the provided schema structure to support granular permissions and role inheritance.

**User Table Updates (`auth-server/src/db/schemas/auth.ts`):**
*   **Remove** `role` column: We are moving to a many-to-many relationship (`user_roles`) to allow users to have multiple roles.
*   **Remove** `permissions` column: Permissions will now be managed via the `user_permissions` table (for direct assignment) or inherited through roles.

**New Tables:**
1.  **`roles`**: Defines roles (e.g., admin, editor, viewer).
    *   Supports hierarchy via `parent_id`.
    *   `isActive` flag for soft disabling.
2.  **`permissions`**: Defines granular capabilities (e.g., `user:create`, `post:delete`).
    *   `isExclusive`: For super-admin only permissions.
3.  **`role_permissions`**: Many-to-Many link between Roles and Permissions.
4.  **`user_roles`**: Many-to-Many link between Users and Roles.
    *   Allows a user to have multiple roles.
5.  **`user_permissions`**: Direct assignment of permissions to users (overrides/extends roles).

**Migration Strategy:**
- We will replace the existing simple `role` table in `auth-server` with these robust tables.
- The `user` table in `better-auth` is core, so we will keep it but `user_roles` will become the source of truth for effective roles.

### 2. Backend Implementation (Auth Server)

**Technology**: Hono + Better Auth + Drizzle ORM

**Session Hydration Strategy:**
To ensure roles and permissions are available in the session without storing them directly in the `user` table, we will use `better-auth`'s `databaseHooks` or a custom session resolution hook.

*   **Hook**: `session.create` (and potentially `session.get` if using JWTs that need refreshing).
*   **Logic**:
    1.  When a session is created/fetched, intercept the user object.
    2.  Query `user_roles` to get all role IDs for the user.
    3.  Query `roles` to get role names/values (and parent roles).
    4.  Query `role_permissions` and `user_permissions` to aggregate all permissions.
    5.  **Inject** these into the session object:
        *   `session.user.roles`: `["admin", "editor"]`
        *   `session.user.permissions`: `["user:create", "post:delete"]`
        *   `session.user.role`: "admin" (Primary role fallback for backward compatibility)

**Handling Better Auth Admin Plugin Compatibility:**

The Better Auth Admin plugin (`banUser`, `impersonate`, etc.) natively expects a `role` column. Since we are removing it, we must ensure compatibility:

1.  **Authorization (Ban/Unban/Impersonate)**:
    *   These operations check `session.user.role`.
    *   **Solution**: Our Session Hydration logic (above) injects `session.user.role = "admin"` (derived from `user_roles`). This satisfies the plugin's authorization check.
    *   **Result**: `authClient.admin.banUser` and `authClient.admin.impersonateUser` will work normally.

2.  **Role Management (`setRole`)**:
    *   The built-in `authClient.admin.setRole` attempts to update the `role` column in the `user` table.
    *   **Problem**: This will fail because the column no longer exists.
    *   **Solution**: We will **ABANDON** the built-in `setRole` method. Instead, we will use our custom endpoints (`/rbac/users/assign-roles`) in the Admin UI.

**Integrating with Better Auth Native Permissions:**
Better Auth's native `hasPermission` (client) and `userHasPermission` (server) rely on its own opinionated RBAC structure. However, we can bridge our custom system to work with it.

1.  **Server-Side (`userHasPermission`)**:
    *   Since we are injecting the resolved permissions into `session.user.permissions`, we can configure Better Auth to check this array.
    *   Alternatively, we will expose our own `checkPermission` endpoint in the RBAC plugin which provides more granular control (e.g., checking hierarchy).
    *   **Recommendation**: Use our custom RBAC plugin's `checkPermission` for complex logic, but populate `session.user.role` with the "primary" role (e.g., highest priority) so basic Better Auth checks still pass.

2.  **Client-Side (`hasPermission`)**:
    *   The client `authClient` will receive the hydrated session.
    *   We can create a lightweight wrapper `usePermission("resource:action")` that checks the hydrated `session.user.permissions` array.
    *   This avoids needing to sync with Better Auth's internal access control map if it's too rigid.

**Components:**
1.  **Schema Update**: Add the 5 new tables to `auth-server/src/db/schemas/auth.ts`.
2.  **RBAC Plugin Overhaul (`src/plugins/rbac.ts`)**:
    *   **Permission Resolution Logic**:
        *   Fetch all roles assigned to user via `user_roles`.
        *   Recursively fetch inherited roles via `roles.parent_id`.
        *   Aggregate permissions from all roles via `role_permissions`.
        *   Add direct permissions from `user_permissions`.
        *   Cache result (optional, for performance).
    *   **Session Extension**:
        *   Use `auth.api.getSession` override or `databaseHooks` to inject `roles` and `permissions` into the returned session user object.
    *   **Endpoints**:
        *   `POST /rbac/roles`: Create role.
        *   `PUT /rbac/roles`: Update role (parent, etc).
        *   `POST /rbac/permissions`: Create permission definition.
        *   `POST /rbac/roles/assign-permissions`: Link role <-> permission.
        *   `POST /rbac/users/assign-roles`: Link user <-> role.
        *   `GET /rbac/check-permission`: Verify access.

### 3. Frontend Implementation (Admin Dashboard)

**Technology**: Next.js 15 + Shadcn UI

**Pages:**
1.  **Roles Management (`/roles`)**:
    *   List all roles.
    *   Create/Edit Role modal (Name, Description, Parent Role).
    *   **Permission Matrix**: A UI to toggle permissions for the selected role.
2.  **Permissions Management (`/permissions`)**:
    *   List all defined system permissions.
    *   Create new permission (Name, Value, Description).
3.  **User Assignment (`/users/[id]`)**:
    *   Multi-select dropdown to assign multiple roles to a user.
    *   Direct permission assignment UI for edge cases.

### 4. Integration Steps
1.  **Database**: Apply schema changes using Drizzle.
2.  **Backend**: Update `rbac.ts` to query the new tables.
3.  **Frontend**: Update Admin UI to consume new endpoints.

## Detailed Schema (Drizzle)

```typescript
// auth-server/src/db/schemas/auth.ts updates

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  value: varchar("value", { length: 100 }).notNull().unique(), // e.g., "org_admin"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  parentId: uuid("parent_id"), // Self-reference for inheritance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Create User"
  value: varchar("value", { length: 100 }).notNull().unique(), // e.g., "user:create"
  description: text("description"),
  isExclusive: boolean("is_exclusive").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] })
]);

export const userRoles = pgTable("user_roles", {
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] })
]);

export const userPermissions = pgTable("user_permissions", {
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.permissionId] })
]);
```

## Usage Examples

### 1. Backend (Hono/Better Auth)

**Middleware/Helper:**

```typescript
import { Context } from "hono";
import { APIError } from "better-auth/api";
import { auth } from "../auth";

/**
 * Middleware to check if the current user has a specific permission.
 * Assumes 'permissions' are injected into session.user during session creation.
 */
export const requirePermission = (permission: string) => async (ctx: Context, next: Function) => {
  const session = await auth.api.getSession({ headers: ctx.req.raw.headers });

  if (!session) {
    throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
  }

  // Check if the permission exists in the user's permissions array
  // We assume session.user.permissions is populated by our hook
  const userPermissions = (session.user as any).permissions || [];
  
  if (!userPermissions.includes(permission)) {
    throw new APIError("FORBIDDEN", { message: `Missing permission: ${permission}` });
  }

  // Attach session to context for downstream handlers
  ctx.set("session", session);
  await next();
};
```

**Route Usage:**

```typescript
app.post(
  "/api/products", 
  requirePermission("product:create"), 
  async (c) => {
    // Logic to create product
    return c.json({ success: true });
  }
);
```

### 2. Client (Next.js / React)

**Custom Hook (`usePermission`):**

```typescript
// hooks/use-permission.ts
import { authClient } from "@/lib/auth-client";

export function usePermission() {
  const { data: session, isPending } = authClient.useSession();

  const checkPermission = (requiredPermission: string) => {
    if (!session?.user) return false;
    
    // Access the injected permissions array
    const userPermissions = (session.user as any).permissions || [];
    return userPermissions.includes(requiredPermission);
  };

  const hasRole = (role: string) => {
      if (!session?.user) return false;
      const userRoles = (session.user as any).roles || []; // Assuming roles array is also injected
      return userRoles.includes(role);
  }

  return { 
    checkPermission, 
    hasRole,
    isLoading: isPending,
    user: session?.user 
  };
}
```

**Component Usage:**

```typescript
"use client";
import { usePermission } from "@/hooks/use-permission";

export default function CreateProductButton() {
  const { checkPermission, isLoading } = usePermission();

  if (isLoading) return null;

  if (!checkPermission("product:create")) {
    return null; // Or return a disabled button / tooltip
  }

  return (
    <button onClick={handleCreate}>
      Create New Product
    </button>
  );
}
```

## Next Steps
1.  Confirm this plan.
2.  Execute Schema Migration.
3.  Update Backend Logic.
4.  Update Admin UI.
