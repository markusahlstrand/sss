import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { AudioUploadSchema, AudioParamsSchema } from "./schemas";
import { AudioService } from "./service";
import { requireScopes } from "../auth/middleware";
import { NotFoundError } from "../common/errors";

// Upload audio route
const uploadAudioRoute = createRoute({
  method: "post",
  path: "/shows/{show_id}/episodes/{episode_id}/audio",
  tags: ["audio"],
  summary: "Upload audio file",
  description: "Upload an audio file for an episode",
  request: {
    params: AudioParamsSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              audio: {
                type: "string",
                format: "binary",
                description: "Audio file to upload",
              },
            },
            required: ["audio"],
          },
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: AudioUploadSchema,
        },
      },
      description: "Audio uploaded successfully",
    },
    404: {
      description: "Episode not found",
    },
  },
  security: [{ Bearer: [] }],
});

// Get audio metadata route
const getAudioRoute = createRoute({
  method: "get",
  path: "/shows/{show_id}/episodes/{episode_id}/audio",
  tags: ["audio"],
  summary: "Get audio metadata",
  description: "Get metadata for an episode's audio file",
  request: {
    params: AudioParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AudioUploadSchema,
        },
      },
      description: "Audio metadata",
    },
    404: {
      description: "Audio or episode not found",
    },
  },
  security: [{ Bearer: [] }],
});

export function registerAudioRoutes(
  app: OpenAPIHono,
  audioService: AudioService
) {
  // Upload audio file
  app.openapi(uploadAudioRoute, async (c) => {
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

    const { show_id, episode_id } = c.req.valid("param");

    try {
      // Parse multipart form data
      const formData = await c.req.formData();
      const audioFile = formData.get("audio") as File | null;

      if (!audioFile) {
        const problem = {
          type: "validation_error",
          title: "Validation Error",
          status: 400,
          detail: "Audio file is required",
          instance: c.req.path,
        };
        throw new HTTPException(400, { message: JSON.stringify(problem) });
      }

      // Convert File to Buffer
      const buffer = Buffer.from(await audioFile.arrayBuffer());

      const fileData = {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        buffer,
      };

      const upload = await audioService.uploadAudio(
        show_id,
        episode_id,
        fileData
      );
      return c.json(upload, 201);
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

  // Get audio metadata
  app.openapi(getAudioRoute, async (c) => {
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

    const { show_id, episode_id } = c.req.valid("param");
    const audio = await audioService.getAudioMetadata(show_id, episode_id);

    if (!audio) {
      const problem = {
        type: "not_found",
        title: "Not Found",
        status: 404,
        detail: "Audio not found",
        instance: c.req.path,
      };
      throw new HTTPException(404, { message: JSON.stringify(problem) });
    }

    return c.json(audio);
  });
}
