import { UserService } from "@/services/user.service";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { z } from "zod/v4";
export const m2mUserRoutes = {
  updateUser: createAuthEndpoint(
    "/m2m/user/:userId",
    {
      method: "PATCH",


      body: z.object({
        name: z.string().optional(),
        image: z.string().optional(),
        properties: z.object(z.unknown()).optional(),
      }),
    },
    async (ctx) => {
      const body = ctx.body;
      const userId = ctx.params.userId;

      await UserService.updateUser(userId, body);
      return {
        message: "User updated successfully",
      };
    },
  ),

  getUser: createAuthEndpoint(
    "/m2m/user/:userId",
    {
      method: "GET",

    },
    async (ctx) => {
      const userId = ctx.params.userId;

      const user = await UserService.getUserById(userId);

      if (!user) {
        throw new APIError("NOT_FOUND", {
          message: "User not found",
        });
      }

      return {
        id: user.id,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        properties: user.properties,
      };
    },
  ),
};
