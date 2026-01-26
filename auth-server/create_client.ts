
import { auth } from "./src/auth";

async function main() {
    try {
        // We need to simulate a context or just call it. 
        // createOAuthClient might require a user session if we want to link it to a user.
        // But for M2M, maybe we don't need a user?
        // My endpoint checked for admin role.
        // But the internal function might not enforce it if called directly?
        // Actually, createOAuthClient checks for session usually?
        // Let's try.
        
        const res = await auth.api.createOAuthClient({
            body: {
                client_name: "M2M Test Client",
                redirect_uris: ["http://localhost:5001/callback"],
                grant_types: ["client_credentials"],
                response_types: ["code"],
                token_endpoint_auth_method: "client_secret_basic",
            }
        });
        console.log("Created Client:", JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

main();
