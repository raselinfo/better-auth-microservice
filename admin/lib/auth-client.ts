import { createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient, apiKeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: "http://localhost:4000",
    plugins: [
        adminClient(),
        magicLinkClient(),
        apiKeyClient()
    ]
});