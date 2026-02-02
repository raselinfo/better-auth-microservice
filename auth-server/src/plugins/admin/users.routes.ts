import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod";
import { UserService } from "@/services/user.service";
import { RbacService } from "@/services/rbac.service";

import { PERMISSION_GUARD } from "@/middlewares/permission_guard";
import { APIError } from "better-auth/api";


export const userRoutes = {
    listUsers: createAuthEndpoint("/admin/users", {
        method: "GET",
        use: [ PERMISSION_GUARD(["user:list"])],
        query: z.object({
            limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
            offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
            search: z.string().optional()
        })
    }, async (ctx) => {
        const result = await UserService.listUsers({
            limit: ctx.query.limit,
            offset: ctx.query.offset,
            search: ctx.query.search
        });
        return result;
    }),

    getUser: createAuthEndpoint("/admin/users/:id", {
        method: "GET",
        use: [ PERMISSION_GUARD(["user:read"])],
    }, async (ctx) => {
        const user = await UserService.getUserById(ctx.params.id);
        if (!user) {
            throw new APIError("NOT_FOUND", { message: "User not found" });
        }
        return user;
    }),

    adminUpdateUser: createAuthEndpoint("/admin/users/:id", {
        method: "PUT",
        use: [ PERMISSION_GUARD(["user:update"])],
        body: z.object({
            name: z.string().optional(),
            image: z.string().optional(),
            emailVerified: z.boolean().optional(),
            properties: z.any().optional()
        })
    }, async (ctx) => {
        const updatedUser = await UserService.updateUser(ctx.params.id, ctx.body);
        return updatedUser;
    }),

    banUser: createAuthEndpoint("/admin/users/:id/ban", {
        method: "POST",
        use: [ PERMISSION_GUARD(["user:ban"])],
        body: z.object({
            reason: z.string().optional()
        })
    }, async (ctx) => {
        const user = await UserService.banUser(ctx.params.id, ctx.body.reason);
        return user;
    }),

    unbanUser: createAuthEndpoint("/admin/users/:id/unban", {
        method: "POST",
        use: [ PERMISSION_GUARD(["user:ban"])],
    }, async (ctx) => {
        const user = await UserService.unbanUser(ctx.params.id);
        return user;
    }),

    assignRole: createAuthEndpoint("/admin/users/:id/roles", {
        method: "POST",
        use: [PERMISSION_GUARD(["user:set-role"])],
        body: z.object({
            role: z.string()
        })
    }, async (ctx) => {
        await RbacService.assignRole(ctx.params.id, ctx.body.role);
        return { success: true };
    }),

    assignPermission: createAuthEndpoint("/admin/users/:id/permissions", {
        method: "POST",
        use: [PERMISSION_GUARD(["user:set-role"])], // Usually grouped with role/permission management
        body: z.object({
            permissionId: z.string()
        })
    }, async (ctx) => {
        await RbacService.assignUserPermission(ctx.params.id, ctx.body.permissionId);
        return { success: true };
    }),
    
    adminRevokeUserSessions: createAuthEndpoint("/admin/users/:id/sessions", {
        method: "DELETE",
        use: [ PERMISSION_GUARD(["session:revoke"])],
    }, async (ctx) => {
        await UserService.revokeUserSessions(ctx.params.id);
        return { success: true };
    })
}