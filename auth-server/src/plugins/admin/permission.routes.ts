import { createAuthEndpoint } from "better-auth/api";
import { PERMISSION_GUARD } from "@/middlewares/permission_guard";
import { RbacService } from "@/services/rbac.service";
import { z } from "zod/v4";

export const permissionRoutes={
    listPermissions: createAuthEndpoint("/admin/permissions", {
        method: "GET",
        use: [ PERMISSION_GUARD(["permission:read"])],
    }, async ()=> {
        const permissions = await RbacService.listPermissions();
        return permissions;
    }),

    createPermission: createAuthEndpoint("/admin/permissions", {
        method: "POST",
        use: [ PERMISSION_GUARD(["permission:create"])],
        body: z.object({
            name: z.string(),
            value: z.string(),
            description: z.string().optional(),
            isExclusive: z.boolean().optional(),
        })
    }, async (ctx)=> {
        const permission = await RbacService.createPermission([ctx.body]);
        return permission;
    }),

    updatePermission: createAuthEndpoint("/admin/permissions/:id", {
        method: "PUT",
        use: [ PERMISSION_GUARD(["permission:update"])],
        body: z.object({
            name: z.string().optional(),
            value: z.string().optional(),
            description: z.string().optional(),
            isExclusive: z.boolean().optional(),
        })
    }, async (ctx)=> {
        await RbacService.updatePermission(ctx.params.id, ctx.body);
        return { success: true };
    }),

    deletePermission: createAuthEndpoint("/admin/permissions/:id", {
        method: "DELETE",
        use: [ PERMISSION_GUARD(["permission:delete"])],
    }, async (ctx)=> {
        await RbacService.deletePermission(ctx.params.id);
        return { success: true };
    }),
}