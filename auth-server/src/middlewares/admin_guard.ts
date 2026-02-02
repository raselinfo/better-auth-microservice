import { RbacService } from "@/services/rbac.service";
import { APIError, createAuthMiddleware } from "better-auth/api";

export const ADMIN_GUARD = createAuthMiddleware(async (ctx) => {
  const { auth } = await import("@/lib/auth");
  // Todo: Ensure the getSession is not only relay on the headers or cookies
  const session = await auth.api.getSession({ headers: ctx.headers! });

  console.log("`Hit Auth Guard")

  if (!session) {
    throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
  }



  const userRoles = session?.user?.roles || [];
  const hasRoles = RbacService.hasRoles(userRoles, ["admin"]);
  if (!hasRoles) {
    throw new APIError("FORBIDDEN", { message: "You are not authorized as an admin" });
  }


  return ctx
});
