import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { auth } from "./lib/auth";
import { cors } from "hono/cors";


const app = new Hono();



app.use("/*", cors({
    origin: (origin) => origin,
    credentials: true,
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
}));





// app.use("*", async (c,next)=> {
//     const session= await auth.api.getSession({headers: c.req.raw.headers});
//     console.log("Session", session);

//     if(!session){
//        c.set("user", null);
//     	c.set("session", null);
//     	await next();
//         return;
//     }

//     c.set("user", session.user);
//     c.set("session", session.session);

//     await next()
// })

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
