import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import {
  EpisodeSchema,
  CreateEpisodeSchema,
  UpdateEpisodeSchema,
  EpisodeParamsSchema,
  ShowParamsSchema,
  PaginationSchema,
} from "./schemas";
import { EpisodeService } from "./service";
import { NotFoundError } from "../common/errors";

// Get episodes for a show
const getEpisodesRoute = createRoute({
  method: "get",
  path: "/shows/{show_id}/episodes",
  tags: ["episodes"],
  summary: "Get episodes",
  description: "Get all episodes for a show",
  request: {
    params: ShowParamsSchema,
    query: PaginationSchema,
  },
  responses: {
    200: {
      description: "Episodes retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                showId: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                audioUrl: { type: "string", nullable: true },
                published: { type: "boolean", nullable: true },
                publishedAt: { type: "string", nullable: true },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Show not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Get single episode
const getEpisodeRoute = createRoute({
  method: "get",
  path: "/shows/{show_id}/episodes/{episode_id}",
  tags: ["episodes"],
  summary: "Get episode",
  description: "Get a single episode by ID",
  request: {
    params: EpisodeParamsSchema,
  },
  responses: {
    200: {
      description: "Episode retrieved successfully",
      content: {
        "application/json": {
          schema: EpisodeSchema,
        },
      },
    },
    404: {
      description: "Episode not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Create episode
const createEpisodeRoute = createRoute({
  method: "post",
  path: "/shows/{show_id}/episodes",
  tags: ["episodes"],
  summary: "Create episode",
  description: "Create a new episode for a show",
  request: {
    params: ShowParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateEpisodeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Episode created successfully",
      content: {
        "application/json": {
          schema: EpisodeSchema,
        },
      },
    },
    404: {
      description: "Show not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Update episode
const updateEpisodeRoute = createRoute({
  method: "patch",
  path: "/shows/{show_id}/episodes/{episode_id}",
  tags: ["episodes"],
  summary: "Update episode",
  description: "Update an existing episode",
  request: {
    params: EpisodeParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateEpisodeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Episode updated successfully",
      content: {
        "application/json": {
          schema: EpisodeSchema,
        },
      },
    },
    404: {
      description: "Episode not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Publish episode
const publishEpisodeRoute = createRoute({
  method: "post",
  path: "/shows/{show_id}/episodes/{episode_id}/publish",
  tags: ["episodes"],
  summary: "Publish episode",
  description: "Publish an episode to make it publicly available",
  request: {
    params: EpisodeParamsSchema,
  },
  responses: {
    200: {
      description: "Episode published successfully",
      content: {
        "application/json": {
          schema: EpisodeSchema,
        },
      },
    },
    404: {
      description: "Episode not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Delete episode
const deleteEpisodeRoute = createRoute({
  method: "delete",
  path: "/shows/{show_id}/episodes/{episode_id}",
  tags: ["episodes"],
  summary: "Delete episode",
  description: "Delete an episode",
  request: {
    params: EpisodeParamsSchema,
  },
  responses: {
    204: {
      description: "Episode deleted successfully",
    },
    404: {
      description: "Episode not found",
    },
  },
  security: [{ Bearer: [] }],
});

export function registerEpisodeRoutes(
  app: OpenAPIHono,
  episodeService: EpisodeService
) {
  // Get episodes for a show
  app.openapi(getEpisodesRoute, async (c) => {
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
    const pagination = c.req.valid("query");
    const episodes = await episodeService.getEpisodesByShowId(
      show_id,
      pagination
    );
    return c.json(episodes);
  });

  // Get episode by ID
  app.openapi(getEpisodeRoute, async (c) => {
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

    const { show_id, episode_id } = c.req.valid("param");
    const episode = await episodeService.getEpisodeById(show_id, episode_id);

    if (!episode) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Episode not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(episode);
  });

  // Create episode
  app.openapi(createEpisodeRoute, async (c) => {
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
    const episodeData = c.req.valid("json");

    try {
      const episode = await episodeService.createEpisode(show_id, episodeData);
      return c.json(episode, 201);
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

  // Update episode
  app.openapi(updateEpisodeRoute, async (c) => {
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

    const { show_id, episode_id } = c.req.valid("param");
    const updateData = c.req.valid("json");

    try {
      const episode = await episodeService.updateEpisode(
        show_id,
        episode_id,
        updateData
      );
      return c.json(episode);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const problem = {
          type: "not_found",
          title: "Not Found",
          status: 404,
          detail: "Episode not found",
          instance: c.req.path,
        };
        throw new HTTPException(404, { message: JSON.stringify(problem) });
      }
      throw error;
    }
  });

  // Publish episode
  app.openapi(publishEpisodeRoute, async (c) => {
    const payload = c.get("jwtPayload") as any;
    if (!payload?.scopes?.includes("podcast.publish")) {
      const problem = {
        type: "forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Required scopes: podcast.publish",
        instance: c.req.path,
      };
      throw new HTTPException(403, { message: JSON.stringify(problem) });
    }

    const { show_id, episode_id } = c.req.valid("param");

    try {
      const episode = await episodeService.publishEpisode(show_id, episode_id);
      return c.json(episode);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const problem = {
          type: "not_found",
          title: "Not Found",
          status: 404,
          detail: "Episode not found",
          instance: c.req.path,
        };
        throw new HTTPException(404, { message: JSON.stringify(problem) });
      }
      throw error;
    }
  });

  // Delete episode
  app.openapi(deleteEpisodeRoute, async (c) => {
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

    const { show_id, episode_id } = c.req.valid("param");

    try {
      await episodeService.deleteEpisode(show_id, episode_id);
      return c.body(null, 204);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const problem = {
          type: "not_found",
          title: "Not Found",
          status: 404,
          detail: "Episode not found",
          instance: c.req.path,
        };
        throw new HTTPException(404, { message: JSON.stringify(problem) });
      }
      throw error;
    }
  });
}
