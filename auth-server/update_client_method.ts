
import { drizzleClient } from "./src/db/client";
import { oauthClient } from "./src/db/schemas";
import { eq } from "drizzle-orm";

async function main() {
    // Update the client to use client_secret_post
    // We'll target the client we found earlier: FvzxyafKvpStMEgiYwhMVlddaDLEOSjL
    
    const clientId = "FvzxyafKvpStMEgiYwhMVlddaDLEOSjL";
    
    await drizzleClient.update(oauthClient)
        .set({ tokenEndpointAuthMethod: "client_secret_post" })
        .where(eq(oauthClient.clientId, clientId));

    console.log("Updated client to use client_secret_post");
    process.exit(0);
}

main();
