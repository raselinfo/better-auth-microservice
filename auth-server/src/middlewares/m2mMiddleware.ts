import { auth } from "@/auth";
import { drizzleClient } from "@/db/client";
import { hashToken } from "@/utils";
import { createHash } from "crypto";




export const m2mMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header("Authorization");
    const clientId = c.req.header("X-Client-Id");
    const clientSecret = c.req.header("X-Client-Secret");

    if (!clientId || !clientSecret) {
        return c.json({ error: "Missing or invalid X-Client-Id or X-Client-Secret header" }, 401);
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }
    const token = authHeader.split(" ")[1];
    const hashedToken = hashToken(token);

    console.log(`Token: `,{token, hashedToken, clientId, clientSecret});
   
    
    // Check db
    const data = await drizzleClient.query.oauthAccessToken.findFirst({
        where: (tokens, { eq, and, gt, or }) => and(
            // or(
            //     eq(tokens.token, token),
            //     eq(tokens.token, hashedToken)
            // ),
             eq(tokens.token, hashedToken),
            gt(tokens.expiresAt, new Date())
        )
    });

//     const data = await auth.api.oauth2Introspect({
//     body: {
//       token:token,
//       client_id: clientId,
//       client_secret: clientSecret,
//       token_type_hint: "access_token"
//     },
//   });

    if (!data) {
        return c.json({ error: "Invalid or expired access token" }, 401);
    }
    
    // c.set('oauth_client_id', accessToken.clientId);
    await next();
};
