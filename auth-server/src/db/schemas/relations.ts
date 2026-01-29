import { relations } from "drizzle-orm";
import { user, session, oauthClient, account } from "./auth";
import { roles, permissions, rolePermissions, userRoles, userPermissions } from "./rbac";

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    oauthClients: many(oauthClient),
    roles: many(userRoles),
    permissions: many(userPermissions),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const oauthClientRelations = relations(oauthClient, ({ one }) => ({
    user: one(user, {
        fields: [oauthClient.userId],
        references: [user.id],
    }),
}));

export const roleRelations = relations(roles, ({ one, many }) => ({
    parent: one(roles, {
        fields: [roles.parentId],
        references: [roles.id],
        relationName: "role_parent",
    }),
    children: many(roles, { relationName: "role_parent" }),
    permissions: many(rolePermissions),
    users: many(userRoles),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
    roles: many(rolePermissions),
    users: many(userPermissions),
}));

export const rolePermissionRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id],
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id],
    }),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
    user: one(user, {
        fields: [userRoles.userId],
        references: [user.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
}));

export const userPermissionRelations = relations(userPermissions, ({ one }) => ({
    user: one(user, {
        fields: [userPermissions.userId],
        references: [user.id],
    }),
    permission: one(permissions, {
        fields: [userPermissions.permissionId],
        references: [permissions.id],
    }),
}));
