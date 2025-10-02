import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

export function createProblem(
  type: string,
  title: string,
  status: number,
  detail: string,
  instance: string
): ProblemDetails {
  return {
    type,
    title,
    status,
    detail,
    instance,
  };
}

export function errorHandler() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      console.error("Error:", error);

      if (error instanceof HTTPException) {
        // HTTPException already has the response format we need
        const response = error.getResponse();
        return response;
      }

      // Handle Zod validation errors
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as any;
        const detail = zodError.issues
          .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");

        const problem = createProblem(
          "validation_error",
          "Validation Error",
          400,
          detail,
          c.req.url
        );

        return c.json(problem, 400, {
          "Content-Type": "application/problem+json",
        });
      }

      // Generic server error
      const problem = createProblem(
        "internal_error",
        "Internal Server Error",
        500,
        "An unexpected error occurred",
        c.req.url
      );

      return c.json(problem, 500, {
        "Content-Type": "application/problem+json",
      });
    }
  };
}

export function throwProblem(
  type: string,
  title: string,
  status: number,
  detail: string,
  instance: string
): never {
  const problem = createProblem(type, title, status, detail, instance);
  throw new HTTPException(status as any, {
    message: JSON.stringify(problem),
  });
}
