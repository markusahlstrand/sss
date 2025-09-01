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

### Publishing

- `POST /shows/{show_id}/episodes/{episode_id}/publish` — Publish episode

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
