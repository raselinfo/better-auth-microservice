import { drizzleClient } from "@/db/client";
import { hashToken } from "@/utils";

import { Context, Next } from "hono";
import { and, eq, gt } from "drizzle-orm";
import { oauthAccessToken } from "@/db/schemas";
import {  APIError, MiddlewareInputContext, MiddlewareOptions } from "better-auth";


export const M2M_GUARD2 = async (c: MiddlewareInputContext<MiddlewareOptions>) => {
  const authHeader = c.request?.headers?.get("Authorization");
  const clientId = c.request?.headers?.get("X-Client-Id");
  const clientSecret = c.request?.headers?.get("X-Client-Secret");


  console.log(`M2m Guard: `, {
    clientId,
    clientSecret,
    authHeader,
  })

  if (
    !clientId ||
    !clientSecret ||
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
   
  }

  const token = authHeader.split(" ")[1];
  const hashedToken = hashToken(token);

  // Todo: check the clientId and client secret from db

  const data = await drizzleClient.query.oauthAccessToken.findFirst({
    where: and(
      eq(oauthAccessToken.token, hashedToken),
      gt(oauthAccessToken.expiresAt, new Date()),
    ),
  });

  if (!data) {
    throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
    
  }

  return {
    context: c,
  };
};


export const M2M_GUARD = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  const clientId = c.req.header("X-Client-Id");
  const clientSecret = c.req.header("X-Client-Secret");

  if (!clientId || !clientSecret) {
    return c.json(
      { error: "Missing or invalid X-Client-Id or X-Client-Secret header" },
      401,
    );
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  const token = authHeader.split(" ")[1];
  const hashedToken = hashToken(token);

  // Check db
  const data = await drizzleClient.query.oauthAccessToken.findFirst({
    where: and(
      eq(oauthAccessToken.token, hashedToken),
      gt(oauthAccessToken.expiresAt, new Date()),
    ),
  });

  if (!data) {
    return c.json({ error: "Invalid or expired access token" }, 401);
  }

  return next();
};
