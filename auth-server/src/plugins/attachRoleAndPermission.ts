import { customSession } from "better-auth/plugins";
import { RbacService } from "../services/rbac.service";


/**
 * It will attach roles and permission to the session object.
 */

export const attachRoleAndPermission = () => customSession(async ({ user, session }) => {
    // 1. Resolve roles and permissions
    const [roles, permissions] = await Promise.all([
        RbacService.resolveUserRoles(user.id),
        RbacService.resolveUserPermissions(user.id)
    ]);

    // 2. Determine the primary role (fallback)
    // If multiple roles, pick the one with lowest 'order' (highest priority).
    // If no roles, default to "user".
    // resolveUserRoles already sorts by order ASC, so the first one is highest priority.
    const primaryRole = roles.length > 0 
        ? roles[0].value 
        : "user";

    // 3. Return the augmented session object
    return {
        user: {
            ...user,
            roles: roles.map(r => r.value), // Inject array of role values
            permissions: permissions,       // Inject array of permission values
            role: primaryRole               // Inject primary role for backward compatibility/admin plugin
        },
        session
    };
});
