import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  varchar,
  primaryKey,
  foreignKey,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  value: varchar("value", { length: 100 }).notNull().unique(), // e.g., "org_admin"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0), // Lower number = higher priority
  parentId: uuid("parent_id"), // Self-reference for inheritance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "roles_parent_id_fkey",
  }),
  index("idx_roles_value_active").on(table.value, table.isActive),
]);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Create User"
  value: varchar("value", { length: 100 }).notNull().unique(), // e.g., "user:create"
  description: text("description"),
  isExclusive: boolean("is_exclusive").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_permissions_value_exclusive").on(table.value, table.isExclusive),
]);

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] }),
  index("idx_role_permissions_role_id").on(t.roleId),
  index("idx_role_permissions_permission_id").on(t.permissionId),
]);

export const userRoles = pgTable("user_roles", {
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
  index('idx_user_roles_user_id').on(t.userId),
]);

export const userPermissions = pgTable("user_permissions", {
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.permissionId] }),
  index('idx_user_permissions_user_id').on(t.userId),
]);
