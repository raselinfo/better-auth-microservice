import { drizzleClient as db } from "./client";
import * as schema from "./schemas/rbac";
import { user } from "./schemas/auth";
import { eq } from "drizzle-orm";
import { statement } from "../permissions";

async function seed() {
    console.log("🌱 Starting RBAC seeding...");

    // 1. Seed Permissions
    console.log("Creating permissions...");
    const allPermissions: { name: string; value: string; description: string }[] = [];

    // Extract permissions from the 'statement' object in permissions.ts
    // Format: resource:action (e.g., "user:create")
    for (const [resource, actions] of Object.entries(statement)) {
        if (Array.isArray(actions)) {
            for (const action of actions) {
                allPermissions.push({
                    name: `${resource.charAt(0).toUpperCase() + resource.slice(1)} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                    value: `${resource}:${action}`,
                    description: `Allow ${action} on ${resource}`
                });
            }
        }
    }

    // Insert permissions if they don't exist
    for (const perm of allPermissions) {
        await db.insert(schema.permissions)
            .values(perm)
            .onConflictDoNothing({ target: schema.permissions.value });
    }
    console.log(`✅ Seeded ${allPermissions.length} permissions.`);

    // 2. Seed Roles
    console.log("Creating roles...");
    const rolesToCreate = [
        {
            name: "Admin",
            value: "admin",
            description: "Administrator with full access",
            isActive: true,
            order: 1
        },
        {
            name: "User",
            value: "user",
            description: "Standard user",
            isActive: true,
            order: 10
        }
    ];

    for (const role of rolesToCreate) {
        await db.insert(schema.roles)
            .values(role)
            .onConflictDoUpdate({
                target: schema.roles.value,
                set: { order: role.order }
            });
    }
    console.log(`✅ Seeded ${rolesToCreate.length} roles.`);

    // 3. Assign Permissions to Admin Role
    console.log("Assigning permissions to Admin role...");
    
    // Get Admin role ID
    const [adminRole] = await db.select().from(schema.roles).where(eq(schema.roles.value, "admin"));
    
    if (adminRole) {
        // Get all permission IDs
        const allPerms = await db.select().from(schema.permissions);
        
        // Prepare bulk insert
        const rolePermValues = allPerms.map(perm => ({
            roleId: adminRole.id,
            permissionId: perm.id
        }));

        // Insert role permissions
        if (rolePermValues.length > 0) {
            await db.insert(schema.rolePermissions)
                .values(rolePermValues)
                .onConflictDoNothing();
        }
        console.log(`✅ Assigned ${rolePermValues.length} permissions to Admin role.`);
    } else {
        console.error("❌ Admin role not found!");
    }

    // 4. Assign Admin Role to Initial User (if configured)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        console.log(`Assigning Admin role to user email: ${adminEmail}...`);
        
        if (adminRole) {
            // Find user by email
            const [foundUser] = await db.select().from(user).where(eq(user.email, adminEmail));

            if (foundUser) {
                await db.insert(schema.userRoles)
                    .values({
                        userId: foundUser.id,
                        roleId: adminRole.id
                    })
                    .onConflictDoNothing();
                console.log(`✅ Assigned Admin role to user ${adminEmail} (ID: ${foundUser.id}).`);
            } else {
                console.warn(`⚠️ User with email ${adminEmail} not found. Skipping role assignment.`);
            }
        }
    } else {
        console.log("ℹ️ No ADMIN_EMAIL environment variable set. Skipping admin user assignment.");
    }

    console.log("✨ RBAC seeding completed successfully.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
