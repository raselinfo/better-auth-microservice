import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { auth } from "./auth";
import { cors } from "hono/cors";
import { drizzleClient } from "./db/client";
import { oauthAccessToken, oauthClient, user } from "./db/schemas";
import { eq, and, gt, or } from "drizzle-orm";
import { m2mMiddleware } from "./middlewares/m2mMiddleware";
import { randomBytes, createHash } from "crypto";
import { hashToken } from "./utils";

const app = new Hono();



app.use("/*", cors({
    origin: (origin) => origin,
    credentials: true,
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
}));

app.post("/api/admin/clients", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    console.log("Admin Client Creation - Session:", session);
    if (!session || session.user.role !== "admin") {
        return c.json({ error: "Unauthorized" }, 401);
    }
    const body = await c.req.json();
    const { name, redirectUris } = body;

    try {
        const newSecret = randomBytes(32).toString('base64url');
        const hashedSecret = hashToken(newSecret);

        const newClient = await drizzleClient.insert(oauthClient).values({
            id: randomBytes(16).toString("hex"),
            name,
            clientId: randomBytes(16).toString("hex"),
            clientSecret: hashedSecret,
            redirectUris: redirectUris || null,
            metadata: JSON.stringify({ display_secret: newSecret }),
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        return c.json({ client: newClient[0], clientSecret: newSecret });
    } catch (error) {
        console.error("Failed to create client:", error);
        return c.json({ error: "Failed to create client" }, 500);
    }
});

app.get("/api/admin/clients", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session || session.user.role !== "admin") {
        return c.json({ error: "Unauthorized" }, 401);
    }
    try {
        const clients = await drizzleClient.select().from(oauthClient);
        
        const clientsWithSecrets = clients.map(client => {
            let secret = null;
            if (client.metadata) {
                try {
                    const meta = JSON.parse(client.metadata);
                    if (meta.display_secret) {
                        secret = meta.display_secret;
                    }
                } catch (e) {
                    // ignore json parse error
                }
            }
            return {
                ...client,
                clientSecret: secret
            };
        });

        return c.json(clientsWithSecrets);
    } catch (error) {
        console.error("Failed to fetch clients:", error);
        return c.json({ error: "Failed to fetch clients" }, 500);
    }
});

app.post("/api/m2m/user/update", m2mMiddleware, async (c) => {
    const body = await c.req.json();
    const { userId, permissions, properties } = body;

    if (!userId) {
        return c.json({ error: "User ID is required" }, 400);
    }

    try {
        await drizzleClient.update(user)
            .set({ 
                permissions: permissions || null,
                properties: properties || null
            })
            .where(eq(user.id, userId));
        
        return c.json({ success: true });
    } catch (error) {
        console.error("Failed to update user:", error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

app.post("/api/admin/user/update", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session || session.user.role !== "admin") {
        return c.json({ error: "Unauthorized" }, 401);
    }
    const body = await c.req.json();
    const { userId, permissions, properties } = body;

    if (!userId) {
        return c.json({ error: "User ID is required" }, 400);
    }

    try {
        await drizzleClient.update(user)
            .set({ 
                permissions: permissions || null,
                properties: properties || null
            })
            .where(eq(user.id, userId));
        
        return c.json({ success: true });
    } catch (error) {
        console.error("Failed to update user:", error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

app.get("/", (c) => c.text("Auth Service is running"));

const port = 4000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
