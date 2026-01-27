import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzleClient } from "./db/client";
import { admin, magicLink, apiKey, bearer, openAPI, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { Resend } from "resend";
import * as schema from "./db/schemas";
import { ac, adminRole, userRole } from "./permissions";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendWebhook = async (userId: string, properties: any) => {
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

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.BASE_URL || "http://localhost:4000",
    database: drizzleAdapter(drizzleClient, {
        provider: "pg",
        schema: schema
    }),
    trustedOrigins: [
        process.env.BETTER_AUTH_URL || "http://localhost:4000", 
     "http://localhost:3000", "http://localhost:3001"
    ],
    emailAndPassword: {
        enabled: false
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
        facebook: {
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
        }
    },
    plugins: [
        magicLink({
                sendMagicLink: async ({ email, url }, _request) => {
                    console.log("----------------------------------------");
                    console.log(`MAGIC LINK FOR ${email}: ${url}`);
                    console.log("----------------------------------------");
                    try {
                    await resend.emails.send({
                        from: process.env.EMAIL_FROM || "Auth Service <onboarding@resend.dev>",
                        to: email,
                        subject: "Login to Auth Service",
                        text: `Click here to login: ${url}`,
                        html: `<a href="${url}">Click here to login</a>`
                    });
                } catch (error) {
                    console.error("Failed to send magic link", error);
                }
            }
        }),
        admin({
            // defaultRole: "user",
            // adminRoles: ["admin", "super-admin"], // we don't need when we use custom access control
            // adminUserIds: [process.env.ADMIN_USER_ID || ""],
            ac,
            roles: {
                admin: adminRole as any,
                user: userRole as any
            }
        }),
        apiKey(),
        bearer(),
        openAPI(),
        jwt(),
        oauthProvider({
            loginPage: "/sign-in",
            consentPage: "/consent",
        })
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user"
            },
            properties: {
                type: "string", 
                required: false,
            },
            permissions: {
                type: "string",
                required: false,
            },
            
        }
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    console.log("New user created:", user.email);
                    console.log("Full user object:", user);
                    await sendWebhook(user.id, { email: user.email });
                }
            }
        },
        // session: {
        //     create: {
        //         after: async (session) => {
        //             console.log("Session created for user:", session.userId);
        //             await sendWebhook(session.userId, { sessionId: session.id });
        //         }
        //     }
        // }
    }
});
