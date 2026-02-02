import { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzleClient } from "../../db/client";
import { magicLink, apiKey, bearer, openAPI, jwt } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import * as schema from "../../db/schemas";
import { createAuthMiddleware } from "better-auth/api";
import { attachRoleAndPermission } from "../../plugins/attachRoleAndPermission";
import { customAdminPlugin } from "../../plugins/admin/admin";
import { resend } from "../../lib/resend";

export const getAuthConfig = (): BetterAuthOptions => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.FACEBOOK_CLIENT_ID ||
    !process.env.FACEBOOK_CLIENT_SECRET ||
    !process.env.BETTER_AUTH_URL
  ) {
    throw new Error(
      "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET or FACEBOOK_CLIENT_ID or FACEBOOK_CLIENT_SECRET or BETTER_AUTH_URL is not set",
    );
  }

  return {
    baseURL: process.env.BETTER_AUTH_URL,

    trustedOrigins: [...(process.env.TRUSTED_ORIGINS || "").split(",")],
    database: drizzleAdapter(drizzleClient, {
      provider: "pg",
      schema: schema,
    }),

    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID || "",
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      },
    },

    session: {
      expiresIn: Number(process.env.SESSION_EXPIRES_IN || 60 * 60 * 24), // 24 hours
      updateAge: Number(process.env.SESSION_UPDATE_AGE || 60 * 60 * 12), // 12 hours
      // required by oauthProvider when using secondaryStorage
      storeSessionInDatabase: true,
    },

    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },

    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }, _request) => {
          try {
            await resend.emails.send({
              from:
                process.env.EMAIL_FROM || "Auth Service <onboarding@resend.dev>",
              to: email,
              subject: "Login to Auth Service",
              text: `Click here to login: ${url}`,
              html: `<a href="${url}">Click here to login</a>`,
            });
          } catch (error) {
            console.error("Failed to send magic link", error);
          }
        },
      }),

      apiKey(),
      bearer(),
      jwt(),
      oauthProvider({
        loginPage: "/sign-in",
        consentPage: "/consent",
      }),
      attachRoleAndPermission(),
      customAdminPlugin(),
      ...(process.env.NODE_ENV === "development" ? [openAPI()] : []),
    ],
    user: {
      additionalFields: {
        properties: {
          type: "json",
          required: false,
        },
      },
    },

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            console.log("New user created:", user.email);
            console.log("Full user object:", user);
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async ({ json, body, setHeader, context }) => {
        console.log("Context", context.session);
        console.log("new Session", context.newSession);
      }),
    },
  };
};