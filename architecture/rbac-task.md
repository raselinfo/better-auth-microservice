# RBAC Implementation Task List

> **Performance & Quality Guidelines:**
> - **High Performance**: Optimize queries (use joins over N+1 loops), index foreign keys, and minimize database roundtrips. Every millisecond counts in auth.
> - **Maintainability**: Use clear folder structures, design patterns (e.g., Service Layer, Repository Pattern), and descriptive naming.
> - **Readability**: Code should be self-documenting.
> - **Type Safety**: NEVER use the `any` type. Always define and use proper TypeScript interfaces/types.

Based on [RBAC Architecture Plan](./rbac-plan.md).

## Phase 1: Database Schema & Migration

- [x] **Define Drizzle Schema** (`auth-server/src/db/schemas/auth.ts`)
    - [x] Create `roles` table (id, name, value, description, isActive, parentId, order).
    - [x] Create `permissions` table (id, name, value, description, isExclusive).
    - [x] Create `role_permissions` join table (roleId, permissionId).
    - [x] Create `user_roles` join table (userId, roleId).
    - [x] Create `user_permissions` join table (userId, permissionId).
    - [x] *Edge Case*: Ensure foreign keys have `onDelete: "cascade"` to prevent orphaned records.
    - [x] *Edge Case*: Add unique constraints on `roles.value` and `permissions.value`.
    - [x] *Edge Case*: Add `order` column to `roles` for priority resolution (Lower = Higher Priority).
- [x] **Generate & Apply Migration**
    - [x] Run `pnpm db:generate`.
    - [x] Run `pnpm db:migrate`.
    - [x] *Verification*: Verify tables exist in Postgres using a DB client.
- [x] **Seed Initial Data**
    - [x] Create default roles: `admin`, `user`.
    - [x] Create essential permissions (e.g., `user:read`, `user:write`, `role:manage`).
    - [x] Assign `admin` role to the initial super-admin user (from env `ADMIN_EMAIL`).

## Phase 2: Backend Logic (Auth Server)

- [ ] **Session Hydration (The Core Logic)**
    - [x] Implement `resolveUserRoles(userId)`: Recursive function to fetch roles + parent roles.
        - [x] *Edge Case*: Detect and break circular dependency loops in parent roles.
    - [x] Implement `resolveUserPermissions(userId)`: Aggregate permissions from:
        - Direct `user_permissions`.
        - Resolved roles -> `role_permissions`.
    - [x] Update `auth.ts` -> `betterAuth` config:
        - [x] Use `databaseHooks.session.create` (or `user.read` / `session.get` depending on strategy) to intercept session creation.
        - [x] Inject `roles` (array), `permissions` (array), and `role` (string fallback) into `session.user`.
        - [x] *Edge Case*: If user has no roles, default `session.user.role` to `"user"`.
        - [x] *Edge Case*: If user has multiple roles, pick the highest priority one for `session.user.role` (e.g., "admin" > "editor" > "user").

- [x] **User Creation Hook**
    - [x] In `auth.ts`, use `databaseHooks.user.create.after`.
    - [x] Call `RbacService.assignRole(userId, "user")` to ensure new users get the default role in `user_roles` table.

- [ ] **RBAC Plugin / API Endpoints** (`auth-server/src/plugins/rbac.ts`)
    - [x] **Session Hydration** (Moved from auth.ts task)
        - [x] Implemented via `customSession` in `rbac.ts`.
    - [ ] **Roles CRUD**
        - [ ] `GET /rbac/roles`: List all roles.
        - [ ] `POST /rbac/roles`: Create new role (Validate uniqueness).
        - [ ] `PUT /rbac/roles/:id`: Update role (Prevent updating `value` if it breaks code references?).
        - [ ] `DELETE /rbac/roles/:id`: Delete role.
    - [ ] **Permissions CRUD**
        - [ ] `GET /rbac/permissions`: List all permissions.
        - [ ] `POST /rbac/permissions`: Create permission.
        - [ ] `DELETE /rbac/permissions`: Delete permission.
    - [ ] **Assignments**
        - [ ] `POST /rbac/roles/:id/permissions`: Bulk assign permissions to role.
        - [ ] `POST /rbac/users/assign-roles`: Assign roles to user.
            - *Action*: Clears existing roles for user (or updates diff) to match request.
            - *Compatibility*: This replaces the native `setRole`.

- [ ] **Compatibility Layer**
    - [ ] **Admin Plugin Hook**:
        - [ ] Verify `session.user.role` injection satisfies `admin.banUser` / `admin.impersonateUser`.
    - [ ] **Middleware**:
        - [ ] Create `requirePermission(permission)` middleware for Hono routes.

## Phase 3: Frontend Implementation (Admin Dashboard)

- [ ] **API Client Updates**
    - [ ] Add methods to `lib/api.ts` (or similar) to call the new `/rbac/*` endpoints.

- [ ] **Role Management Page** (`/admin/roles`)
    - [ ] **List View**: Table showing roles, number of users, status.
    - [ ] **Create/Edit Modal**:
        - [ ] Input: Name, Value, Description.
        - [ ] Parent Role Selection (Dropdown).
    - [ ] **Permission Matrix**:
        - [ ] Visual grid or multi-select list to toggle permissions for the role.
        - [ ] *UX*: Group permissions by resource (e.g., "User Management", "Post Management").

- [ ] **User Management Updates** (`/admin/users/[id]`)
    - [ ] **Role Assignment**:
        - [ ] Replace single Select (setRole) with Multi-Select (Combobox) for Roles.
        - [ ] Fetch available roles from `GET /rbac/roles`.
        - [ ] On save, call `POST /rbac/users/assign-roles`.
    - [ ] **Permission Debugger** (Optional but recommended):
        - [ ] Read-only view showing "Effective Permissions" for the user (Resolved from roles).

- [ ] **Access Control in UI**
    - [ ] Create `usePermission` hook.
    - [ ] Wrap sensitive buttons (e.g., "Delete User") with checks: `if (hasPermission("user:delete"))`.

## Phase 4: Verification & Cleanup

- [ ] **Testing**
    - [ ] **Scenario 1**: Create a role "Editor", assign "post:create", assign role to User A. Login as User A. Verify `session.user.permissions` includes "post:create".
    - [ ] **Scenario 2 (Inheritance)**: Create "Senior Editor" with parent "Editor". User B has "Senior Editor". Verify User B has "post:create".
    - [ ] **Scenario 3 (Backward Compat)**: User A tries to access a route protected by `admin` plugin (e.g. ban). Should fail (unless Editor has admin privileges).
    - [ ] **Scenario 4**: Assign "admin" role to User A. Verify `session.user.role` is "admin". Verify `banUser` works.

- [ ] **Cleanup**
    - [ ] Remove `role` column from `user` table (or leave as legacy/ignored).
    - [ ] Remove `permissions` column from `user` table.
