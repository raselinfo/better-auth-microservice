import { RbacService } from "@/services/rbac.service";
import { APIError, createAuthMiddleware } from "better-auth/api";

export const PERMISSION_GUARD = (requiredPermissions: string[])=> {
    return createAuthMiddleware(async (ctx) => {
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: ctx.headers! });

  if (!session) {
    throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
  }



  const userPermissions = session?.user?.permissions || [];
  const hasPermission = RbacService.hasPermissions(userPermissions, requiredPermissions);
  if (!hasPermission) {
    throw new APIError("FORBIDDEN", { message: "You are not authorized to perform this action" });
  }


  return ctx
});

}