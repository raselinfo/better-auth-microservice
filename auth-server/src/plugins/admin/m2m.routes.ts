import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod/v4";
import { ADMIN_GUARD } from "@/middlewares/admin_guard";
import { PERMISSION_GUARD } from "@/middlewares/permission_guard";
import { M2MService } from "@/services/m2m.service";

export const m2mRoutes = {
  createClient: createAuthEndpoint(
    "/admin/m2m/client",
    {
      method: "POST",
      use: [PERMISSION_GUARD(["system:manage_settings"])],
      body: z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        scope: z.string().optional(),
        redirectUris: z.array(z.string().url()).optional(),
      }),
    },
    async (ctx) => {
      const result = await M2MService.createClient(ctx.body);
      return result;
    },
  ),

  listClients: createAuthEndpoint(
    "/admin/m2m/client",
    {
      method: "GET",
      use: [PERMISSION_GUARD(["system:manage_settings"])],
    },
    async () => {
      const clients = await M2MService.listClients();
      return clients;
    },
  ),
};
