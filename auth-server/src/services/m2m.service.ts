import { drizzleClient } from "@/db/client";
import { oauthClient } from "@/db/schemas/auth";
import { hashToken } from "@/utils";
import { randomBytes } from "crypto";

export class M2MService {
    static async createClient(payload: { name: string; redirectUris?: string[] }) {
        const { name, redirectUris } = payload;
        
        const newSecret = randomBytes(32).toString('base64url');
        const hashedSecret = hashToken(newSecret);

        const newClient = await drizzleClient.insert(oauthClient).values({
            id: randomBytes(16).toString("hex"),
            name,
            clientId: randomBytes(16).toString("hex"),
            clientSecret: hashedSecret,
            redirectUris: redirectUris ? redirectUris.join(",") : null,
            grantTypes: "client_credentials",
            metadata: JSON.stringify({ display_secret: newSecret }),
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        return {
            client: newClient[0],
            clientSecret: newSecret
        };
    }

    static async listClients() {
        const clients = await drizzleClient.select().from(oauthClient);
        
        const clientsWithSecrets = clients.map(client => {
            let secret = null;
            if (client.metadata) {
                try {
                    const meta = JSON.parse(client.metadata as string);
                    if (meta.display_secret) {
                        secret = meta.display_secret;
                    }
                } catch (e) {
                    console.error(`Error parsing metadata for client ${client.id}:`, e);
                    // ignore json parse error
                }
            }
            return {
                ...client,
                clientSecret: secret
            };
        });

        return clientsWithSecrets;
    }
}
