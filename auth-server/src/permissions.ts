import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    user: ["create", "read", "update", "delete", "list", "set-role", "ban", "impersonate", "set-password"],
    system: ["manage_settings"]
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
    user: ["create", "read", "update", "delete", "list", "set-role", "ban", "impersonate", "set-password"],
    system: ["manage_settings"]
});

export const userRole = ac.newRole({
    // Standard users should not have access to admin operations
    // They can only update their own profile via standard endpoints
});
