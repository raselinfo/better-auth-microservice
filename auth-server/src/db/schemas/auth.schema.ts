import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { permissions, roles } from './rbac';
import z from 'zod/v4';



// Roles Schema
export const RoleInsertSchema=createInsertSchema (roles)
export type RoleInsert=z.infer<typeof RoleInsertSchema>

export const RoleSelectSchema=createSelectSchema(roles)
export type RoleSelect=z.infer<typeof RoleSelectSchema>


export const RoleUpdateSchema=createUpdateSchema(roles).omit({
    id: true,
    createdAt: true,
})
export type RoleUpdate=z.infer<typeof RoleUpdateSchema>


// Permissions Schema
export const PermissionInsertSchema=createInsertSchema (permissions)
export type PermissionInsert=z.infer<typeof PermissionInsertSchema>

export const PermissionSelectSchema=createSelectSchema(permissions)
export type PermissionSelect=z.infer<typeof PermissionSelectSchema>

export const PermissionUpdateSchema=createUpdateSchema(permissions).omit({
    id: true,
    createdAt: true,
    
})
export type PermissionUpdate=z.infer<typeof PermissionUpdateSchema>