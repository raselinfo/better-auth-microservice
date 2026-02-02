import { eq, like, or, and, desc, sql } from "drizzle-orm";
import { drizzleClient as db } from "../db/client";
import { user, session } from "../db/schemas/auth";
import { RbacService } from "./rbac.service";

export class UserService {
    /**
     * List users with pagination and search
     */
    static async listUsers(params: { 
        limit?: number; 
        offset?: number; 
        search?: string;
    }) {
        const { limit = 10, offset = 0, search } = params;
        
        const whereClause = search 
            ? or(
                like(user.name, `%${search}%`),
                like(user.email, `%${search}%`)
            )
            : undefined;

        const usersQuery = db.select()
            .from(user)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(user.createdAt));

        const countQuery = db.select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);

        const [users, countResult] = await Promise.all([
            usersQuery,
            countQuery
        ]);

        return {
            users,
            total: Number(countResult[0]?.count || 0)
        };
    }

    /**
     * Get a single user by ID with roles and permissions
     */
    static async getUserById(userId: string,) {
       return  db.query.user.findFirst({
            where: eq(user.id, userId)
        });
    }


    static async getUserWithRoles(userId: string){
         const userRecord = await db.query.user.findFirst({
            where: eq(user.id, userId)
        });

        if (!userRecord) return null;

        const [roles, permissions] = await Promise.all([
            RbacService.resolveUserRoles(userId),
            RbacService.resolveUserPermissions(userId)
        ]);

        return {
            ...userRecord,
            roles,
            permissions
        };
    }
    /**
     * Update user details
     */
    static async updateUser(userId: string, data: {
        name?: string;
        image?: string;
        properties?: Record<string, unknown>;
    }) {
        const [updatedUser] = await db.update(user)
            .set(data)
            .where(eq(user.id, userId))
            .returning();
        
        return updatedUser;
    }

    /**
     * Ban a user
     */
    static async banUser(userId: string, reason?: string) {
        // 1. Update user ban status
        const [bannedUser] = await db.update(user)
            .set({
                banned: true,
                banReason: reason,
                banExpires: null // Permanent ban by default, logic can be extended
            })
            .where(eq(user.id, userId))
            .returning();

        // 2. Revoke all sessions
        await this.revokeUserSessions(userId);

        return bannedUser;
    }

    /**
     * Unban a user
     */
    static async unbanUser(userId: string) {
        const [unbannedUser] = await db.update(user)
            .set({
                banned: false,
                banReason: null,
                banExpires: null
            })
            .where(eq(user.id, userId))
            .returning();

        return unbannedUser;
    }

    /**
     * Delete a user
     */
    static async deleteUser(userId: string) {
        await db.delete(user).where(eq(user.id, userId));
    }

    /**
     * Revoke all sessions for a user
     */
    static async revokeUserSessions(userId: string) {
        await db.delete(session).where(eq(session.userId, userId));
    }
}