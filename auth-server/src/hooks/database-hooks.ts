import { BetterAuthOptions } from "better-auth";
import { RbacService } from "../services/rbac.service";

const sendWebhook = async (userId: string, properties: Record<string, unknown>) => {
    const webhookUrl = "http://localhost:5001/api/webhook/create-user";
    console.log(`Sending webhook to ${webhookUrl} for user ${userId}`);
    if (!webhookUrl) return;
    try {
       const result= await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, properties })
        });

        console.log(`Webhook response:`,await result.json());
    } catch (error) {
        console.error(`Webhook failed:`, error);
    }
};

export const databaseHooks: BetterAuthOptions["databaseHooks"] = {
    user: {
        create: {
            after: async (user) => {
                console.log("New user created:", user.email);
                console.log("Full user object:", user);
                
                // Assign default "user" role
                await RbacService.assignRole(user.id, "user");
                
                await sendWebhook(user.id, { email: user.email });
            }
        },
        // Session Hydration is handled by 'rbacSession' plugin in '../plugins/custom-session.ts'
    },
    // session: {
    //     create: {
    //         after: async (session) => {
    //             console.log("Session created for user:", session);

    //         }
    //     }
    // }
};
