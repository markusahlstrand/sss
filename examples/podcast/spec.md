# Podcast Service Specification

## Overview

This document defines the API and event contract for a Podcast Service compliant with Service Standard v1. The service manages podcast shows, episodes, audio uploads, and publishing workflows. It is designed for compatibility and replaceability across languages and frameworks.

## Authentication

- **OIDC Provider:** https://auth2.sesamy.dev/.well-known/openid-configuration
- **OAuth2 Bearer Token** via `Authorization: Bearer <token>`
- **Scope-based authorization**

## Resources

- **Show**: A podcast show (series)
- **Episode**: An episode within a show
- **Audio Upload**: Audio file for an episode

## API Endpoints

### Service Info

- `GET /` — Service info `{ name, version }`
- `GET /openapi.json` — OpenAPI 3.0 spec

### Health

- `GET /healthz` — Liveness
- `GET /readyz` — Readiness

### Shows

- `GET /shows` — List shows (pagination: `limit`, `offset`)
- `POST /shows` — Create show
- `GET /shows/{show_id}` — Get show
- `PATCH /shows/{show_id}` — Update show
- `DELETE /shows/{show_id}` — Delete show

### Episodes

- `GET /shows/{show_id}/episodes` — List episodes (pagination)
- `POST /shows/{show_id}/episodes` — Create episode
- `GET /shows/{show_id}/episodes/{episode_id}` — Get episode
- `PATCH /shows/{show_id}/episodes/{episode_id}` — Update episode
- `DELETE /shows/{show_id}/episodes/{episode_id}` — Delete episode

### Audio Uploads

- `POST /shows/{show_id}/episodes/{episode_id}/audio` — Upload audio file (multipart/form-data)
- `GET /shows/{show_id}/episodes/{episode_id}/audio` — Get audio file metadata

### Image Uploads

- `POST /shows/{show_id}/image` — Upload show image (multipart/form-data)
- `POST /shows/{show_id}/episodes/{episode_id}/image` — Upload episode image (multipart/form-data)

### Publishing

- `POST /shows/{show_id}/episodes/{episode_id}/publish` — Publish episode

### Task Queue

- `POST /tasks` — Create a new task
- `GET /tasks` — List tasks with optional status filter (`?status=pending|processing|done|failed`)
- `GET /tasks/{task_id}` — Get specific task details

## Request/Response Format

- **Content-Type:** application/json
- **JSON Schema** for all requests/responses
- **Problem+JSON** (RFC 7807) for errors

## Events

- **CloudEvents** (JSON)
- **AsyncAPI 2.0** spec
- **Events:**
  - `show.created`
  - `show.updated`
  - `show.deleted`
  - `episode.created`
  - `episode.updated`
  - `episode.deleted`
  - `episode.published`
  - `audio.uploaded`
  - `image.uploaded`

## Task Queue System

The service includes a simple task processing system for background operations like transcription, encoding, and other asynchronous work.

### Database Schema

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                          -- "transcribe", "encode", etc.
  status TEXT NOT NULL DEFAULT 'pending',      -- "pending", "processing", "done", "failed"
  payload TEXT,                                -- JSON with input data (file references, options)
  result TEXT,                                 -- JSON with output (transcript URL, encoded file URL, etc.)
  error TEXT,                                  -- error message if failed
  attempts INTEGER DEFAULT 0,                  -- how many times we tried this task
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Task Processing

1. **Create task**: HTTP POST `/tasks` inserts a new row with `type` and `payload`, returns task `id`
2. **List tasks**: HTTP GET `/tasks?status=pending|processing|done|failed` returns JSON array of matching tasks
3. **Process tasks**: A scheduled Worker (via Cron) should:
   - Fetch N oldest `pending` tasks
   - Update their status to `processing` and increment `attempts`
   - Execute the job (stub handler per `type`)
   - On success: update `status="done"` and write `result`
   - On failure: update `status="failed"` and write `error`

### Task Types

- `transcribe` — Audio transcription tasks
- `encode` — Audio encoding/conversion tasks
- `publish` — Episode publishing workflows
- `notification` — Email/webhook notifications

### Notes

- `payload` and `result` are JSON strings
- Use parameterized SQL queries to avoid injection
- Keep batch size configurable (e.g., 5 tasks per cron run)
- `updated_at` is set automatically on every row update

## Required Scopes

- `podcast.read`
- `podcast.write`
- `podcast.publish`

## Example Schemas

### Show

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "image_url": "string",
  "created_at": "string (date-time)",
  "updated_at": "string (date-time)"
}
```

### Episode

```json
{
  "id": "string",
  "show_id": "string",
  "title": "string",
  "description": "string",
  "image_url": "string",
  "audio_url": "string",
  "published": false,
  "published_at": "string (date-time)",
  "created_at": "string (date-time)",
  "updated_at": "string (date-time)"
}
```

### Audio Upload

```json
{
  "id": "string",
  "episode_id": "string",
  "file_name": "string",
  "file_size": 123456,
  "mime_type": "audio/mpeg",
  "url": "string",
  "uploaded_at": "string (date-time)"
}
```

### Image Upload

```json
{
  "id": "string",
  "show_id": "string (optional)",
  "episode_id": "string (optional)",
  "file_name": "string",
  "file_size": 123456,
  "mime_type": "image/jpeg",
  "url": "string",
  "uploaded_at": "string (date-time)"
}
```

### Task

```json
{
  "id": "string",
  "type": "string",
  "status": "pending|processing|done|failed",
  "payload": "object (JSON)",
  "result": "object (JSON, optional)",
  "error": "string (optional)",
  "attempts": 0,
  "created_at": "string (date-time)",
  "updated_at": "string (date-time)"
}
```

## Error Types

- `validation_error`
- `unauthorized`
- `forbidden`
- `not_found`
- `conflict`
- `internal_error`

## Service Manifest Example

```yaml
name: podcast-service
version: 1.0.0
owner: team-podcast
api: ./openapi.yaml
events: ./asyncapi.yaml
auth:
  oidc: https://auth2.sesamy.dev/.well-known/openid-configuration
  required_scopes:
    - podcast.read
    - podcast.write
    - podcast.publish
```

---

This spec is based on Service Standard v1 and the Transistor.fm API, adapted for open, portable backend service design.
