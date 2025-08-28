import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`Error in ${c.req.method} ${c.req.path}:`, err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors
      .map((error) => {
        const path = error.path.length > 0 ? error.path.join(".") : "field";
        return `${path} ${error.message}`;
      })
      .join(", ");

    const problem = {
      type: "validation_error",
      title: "Validation Error",
      status: 400,
      detail: validationErrors,
      instance: c.req.path,
    };

    return c.json(problem, 400, {
      "Content-Type": "application/problem+json",
    });
  }

  // Handle HTTP exceptions
  if (err instanceof HTTPException) {
    let problem;

    try {
      // Try to parse as RFC 7807 problem
      problem = JSON.parse(err.message);
    } catch {
      // Fallback to generic problem
      const status = err.status;
      let type = "internal_error";
      let title = "Internal Server Error";

      switch (status) {
        case 400:
          type = "validation_error";
          title = "Validation Error";
          break;
        case 401:
          type = "unauthorized";
          title = "Unauthorized";
          break;
        case 403:
          type = "forbidden";
          title = "Forbidden";
          break;
        case 404:
          type = "not_found";
          title = "Not Found";
          break;
        case 409:
          type = "conflict";
          title = "Conflict";
          break;
      }

      problem = {
        type,
        title,
        status,
        detail: err.message,
        instance: c.req.path,
      };
    }

    return c.json(problem, err.status, {
      "Content-Type": "application/problem+json",
    });
  }

  // Handle other errors
  const problem = {
    type: "internal_error",
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred",
    instance: c.req.path,
  };

  return c.json(problem, 500, {
    "Content-Type": "application/problem+json",
  });
};
