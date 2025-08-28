import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

interface JWTPayload {
  sub: string;
  scopes: string[];
}

export const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || "your-secret-key",
});

export const requireScopes = (requiredScopes: string[]) => {
  return createMiddleware<{
    Variables: {
      jwtPayload: JWTPayload;
    };
  }>(async (c, next) => {
    const payload = c.get("jwtPayload") as JWTPayload;

    if (!payload) {
      const problem = {
        type: "unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "JWT payload not found",
        instance: c.req.path,
      };

      throw new HTTPException(401, {
        message: JSON.stringify(problem),
      });
    }

    const userScopes = payload.scopes || [];
    const hasRequiredScope = requiredScopes.some((scope) =>
      userScopes.includes(scope)
    );

    if (!hasRequiredScope) {
      const problem = {
        type: "forbidden",
        title: "Forbidden",
        status: 403,
        detail: `Required scopes: ${requiredScopes.join(
          ", "
        )}. User has: ${userScopes.join(", ")}`,
        instance: c.req.path,
      };

      throw new HTTPException(403, {
        message: JSON.stringify(problem),
      });
    }

    await next();
  });
};
