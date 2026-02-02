import { BetterAuthPlugin } from "better-auth";
import { m2mUserRoutes } from "./m2m_users.routes";
import { M2M_GUARD, M2M_GUARD2 } from "@/middlewares/m2m_guard";

export const m2mAuth= (): BetterAuthPlugin=> {
return {
    id: "m2m-auth",
    endpoints: {
        ...m2mUserRoutes,
    }

    ,
    hooks: {
        before: [
            {
                matcher: (context) => {
                    console.log(`Matching path: ${context?.path}`)
                    return context?.path?.startsWith("/m2m") ?? false;
                },
                handler: M2M_GUARD2
            }
        ]
    }
}
}