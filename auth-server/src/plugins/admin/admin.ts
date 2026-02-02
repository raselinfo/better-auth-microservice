import {

  BetterAuthPlugin,
  
} from "better-auth";


import { rolesRoutes } from "./roles.routes";
import { permissionRoutes } from "./permission.routes";
import { userRoutes } from "./users.routes";
import { m2mRoutes } from "./m2m.routes";
import { ADMIN_GUARD } from "@/middlewares/admin_guard";

export const customAdminPlugin = (): BetterAuthPlugin => {
  return {
    id: "customAdminPlugin",
    endpoints: {
      ...userRoutes,
    //   Roles Endpoints
    ...rolesRoutes,
    ...permissionRoutes,
    ...m2mRoutes,
    },
    hooks: {

      // Any request that starts with /admin will be protected by the admin guard
      before: [
        {
          matcher: (context) => {
            console.log(`Matching path: ${context?.path}`)
            return context?.path?.startsWith("/admin") ?? false;
          },
          handler: ADMIN_GUARD
        }
      ]
    }

  };
};
