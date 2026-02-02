import { PERMISSION_GUARD } from "@/middlewares/permission_guard";
import { RbacService } from "@/services/rbac.service";
import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod/v4";

export const rolesRoutes={
    listRoles: createAuthEndpoint("/admin/roles", {
        method: "GET",
        use: [ PERMISSION_GUARD(["role:read"])],
        
    }, async ()=> {
        const roles = await RbacService.listRoles();
        return roles;
    }),

    createRole: createAuthEndpoint("/admin/roles", {
        method: "POST",
        use: [ PERMISSION_GUARD(["role:create"])],
        body: z.object({
            name: z.string(),
            value: z.string(),
            description: z.string().optional(),
            order: z.number().optional(),
            parentId: z.string().optional()
        })
    }, async (ctx)=> {
        const role = await RbacService.createRole([ctx.body]);
        return role;
    }),

    updateRole: createAuthEndpoint("/admin/roles/:id", {
        method: "PUT",
        use: [ PERMISSION_GUARD(["role:update"])],
        body: z.object({
            name: z.string().optional(),
            value: z.string().optional(),
            description: z.string().optional(),
            order: z.number().optional(),
            isActive: z.boolean().optional(),
            parentId: z.string().optional().nullable()
        })
    }, async (ctx)=> {
        await RbacService.updateRole(ctx.params.id, ctx.body);
        return { success: true };
    }),

    deleteRole: createAuthEndpoint("/admin/roles/:id", {
        method: "DELETE",
        use: [ PERMISSION_GUARD(["role:delete"])],
    }, async (ctx)=> {
        await RbacService.deleteRole(ctx.params.id);
        return { success: true };
    }),
}