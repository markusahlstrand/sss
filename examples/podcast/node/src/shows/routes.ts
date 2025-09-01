import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import {
  CreateShowSchema,
  UpdateShowSchema,
  ShowSchema,
  PaginationSchema,
  ShowParamsSchema,
} from "./schemas";
import { ShowService } from "./service";
import { requireScopes } from "../auth/middleware";
import { NotFoundError } from "../common/errors";

// Get shows route
const getShowsRoute = createRoute({
  method: "get",
  path: "/shows",
  tags: ["shows"],
  summary: "Get all shows",
  description: "Get a paginated list of podcast shows",
  request: {
    query: PaginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ShowSchema.array(),
        },
      },
      description: "List of shows",
    },
  },
  security: [{ Bearer: [] }],
});

// Get show by ID route
const getShowRoute = createRoute({
  method: "get",
  path: "/shows/{show_id}",
  tags: ["shows"],
  summary: "Get show by ID",
  description: "Get a specific podcast show by its ID",
  request: {
    params: ShowParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ShowSchema,
        },
      },
      description: "Show details",
    },
    404: {
      description: "Show not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Create show route
const createShowRoute = createRoute({
  method: "post",
  path: "/shows",
  tags: ["shows"],
  summary: "Create a new show",
  description: "Create a new podcast show",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateShowSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ShowSchema,
        },
      },
      description: "Created show",
    },
  },
  security: [{ Bearer: [] }],
});

// Update show route
const updateShowRoute = createRoute({
  method: "patch",
  path: "/shows/{show_id}",
  tags: ["shows"],
  summary: "Update a show",
  description: "Update an existing podcast show",
  request: {
    params: ShowParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateShowSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ShowSchema,
        },
      },
      description: "Updated show",
    },
    404: {
      description: "Show not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Delete show route
const deleteShowRoute = createRoute({
  method: "delete",
  path: "/shows/{show_id}",
  tags: ["shows"],
  summary: "Delete a show",
  description: "Delete an existing podcast show",
  request: {
    params: ShowParamsSchema,
  },
  responses: {
    204: {
      description: "Show deleted successfully",
    },
    404: {
      description: "Show not found",
    },
  },
  security: [{ Bearer: [] }],
});

export function registerShowRoutes(app: OpenAPIHono, showService: ShowService) {
  // Get all shows
  app.openapi(getShowsRoute, async (c) => {
    // Check auth
    const payload = c.get("jwtPayload") as any;
    if (!payload?.scopes?.includes("podcast.read")) {
      const problem = {
        type: "forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Required scopes: podcast.read",
        instance: c.req.path,
      };
      throw new HTTPException(403, { message: JSON.stringify(problem) });
    }

    const pagination = c.req.valid("query");
    const shows = await showService.getAllShows(pagination);
    return c.json(shows);
  });

  // Get show by ID
  app.openapi(getShowRoute, async (c) => {
    // Check auth
    const payload = c.get("jwtPayload") as any;
    if (!payload?.scopes?.includes("podcast.read")) {
      const problem = {
        type: "forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Required scopes: podcast.read",
        instance: c.req.path,
      };
      throw new HTTPException(403, { message: JSON.stringify(problem) });
    }

    const { show_id } = c.req.valid("param");
    const show = await showService.getShowById(show_id);

    if (!show) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Show not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(show);
  });

  // Create show
  app.openapi(createShowRoute, async (c) => {
    // Check auth
    const payload = c.get("jwtPayload") as any;
    if (!payload?.scopes?.includes("podcast.write")) {
      const problem = {
        type: "forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Required scopes: podcast.write",
        instance: c.req.path,
      };
      throw new HTTPException(403, { message: JSON.stringify(problem) });
    }

    const showData = c.req.valid("json");
    const show = await showService.createShow(showData);
    return c.json(show, 201);
  });

  // Update show
  app.openapi(updateShowRoute, async (c) => {
    // Check auth
    const payload = c.get("jwtPayload") as any;
    if (!payload?.scopes?.includes("podcast.write")) {
      const problem = {
        type: "forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Required scopes: podcast.write",
        instance: c.req.path,
      };
      throw new HTTPException(403, { message: JSON.stringify(problem) });
    }

    const { show_id } = c.req.valid("param");
    const updateData = c.req.valid("json");

    try {
      const show = await showService.updateShow(show_id, updateData);
      return c.json(show);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const problem = {
          type: "not_found",
          title: "Not Found",
          status: 404,
          detail: "Show not found",
          instance: c.req.path,
        };
        throw new HTTPException(404, { message: JSON.stringify(problem) });
      }
      throw error;
    }
  });

  // Delete show
  app.openapi(deleteShowRoute, async (c) => {
    // Check auth
    const payload = c.get("jwtPayload") as any;
    if (!payload?.scopes?.includes("podcast.write")) {
      const problem = {
        type: "forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Required scopes: podcast.write",
        instance: c.req.path,
      };
      throw new HTTPException(403, { message: JSON.stringify(problem) });
    }

    const { show_id } = c.req.valid("param");

    try {
      await showService.deleteShow(show_id);
      return c.body(null, 204);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const problem = {
          type: "not_found",
          title: "Not Found",
          status: 404,
          detail: "Show not found",
          instance: c.req.path,
        };
        throw new HTTPException(404, { message: JSON.stringify(problem) });
      }
      throw error;
    }
  });
}
