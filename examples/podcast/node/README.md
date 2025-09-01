# Podcast Service - Node.js/Hono Implementation

A **Service Standard v1** compliant podcast service built with **Hono**, **Zod OpenAPI**, **SQLite**, and **Drizzle ORM**.

## Features

- ✅ **Service Standard v1** compliant
- ✅ **Hono + Zod OpenAPI** for type-safe API development
- ✅ **SQLite with Drizzle ORM** for data persistence
- ✅ **JWT authentication** with scope-based authorization
- ✅ **CloudEvents** for event publishing
- ✅ **OpenTelemetry** for observability
- ✅ **RFC 7807 Problem+JSON** error handling
- ✅ **Automatic API documentation** via Swagger UI
- ✅ **Docker** support

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run database migrations:**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The service will be available at `http://localhost:3000`.

### API Documentation

- **Swagger UI:** http://localhost:3000/swagger
- **OpenAPI JSON:** http://localhost:3000/openapi.json
- **Service Info:** http://localhost:3000/

### Authentication

Generate a test JWT token:

```bash
npm run generate-token
```

Use the token in the Authorization header:

```
Authorization: Bearer <token>
```

## API Endpoints

### Service Info

- `GET /` — Service info
- `GET /openapi.json` — OpenAPI specification

### Health

- `GET /healthz` — Liveness probe
- `GET /readyz` — Readiness probe

### Shows

- `GET /shows` — List shows
- `POST /shows` — Create show
- `GET /shows/{show_id}` — Get show
- `PATCH /shows/{show_id}` — Update show
- `DELETE /shows/{show_id}` — Delete show

### Episodes

- `GET /shows/{show_id}/episodes` — List episodes
- `POST /shows/{show_id}/episodes` — Create episode
- `GET /shows/{show_id}/episodes/{episode_id}` — Get episode
- `PATCH /shows/{show_id}/episodes/{episode_id}` — Update episode
- `DELETE /shows/{show_id}/episodes/{episode_id}` — Delete episode

### Publishing

- `POST /shows/{show_id}/episodes/{episode_id}/publish` — Publish episode

### Audio

- `POST /shows/{show_id}/episodes/{episode_id}/audio` — Upload audio (multipart/form-data)
- `GET /shows/{show_id}/episodes/{episode_id}/audio` — Get audio metadata

## Required Scopes

- `podcast.read` — Read access to shows and episodes
- `podcast.write` — Create/update shows and episodes
- `podcast.publish` — Publish episodes

## Events

The service publishes CloudEvents for:

- `show.created`
- `show.updated`
- `show.deleted`
- `episode.created`
- `episode.updated`
- `episode.deleted`
- `episode.published`
- `audio.uploaded`

See `asyncapi.yaml` for event schemas.

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # Type checking
```

### Database

```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

## Docker

### Build and run:

```bash
docker-compose up --build
```

### Development with Docker:

```bash
docker-compose -f docker-compose.yml up
```

## Project Structure

```
src/
├── database/           # Database client and schema
├── auth/              # Authentication middleware
├── common/            # Shared utilities and error handling
├── events/            # CloudEvents publishing
├── health/            # Health check endpoints
├── shows/             # Shows module (routes, service, repository, schemas)
├── episodes/          # Episodes module
├── audio/             # Audio upload module
├── scripts/           # Utility scripts
├── app.ts             # Hono app setup
├── main.ts            # Entry point
└── telemetry.ts       # OpenTelemetry setup
```

## Example Usage

### Create a Show

```bash
curl -X POST http://localhost:3000/shows \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Podcast",
    "description": "A great podcast about technology"
  }'
```

### Create an Episode

```bash
curl -X POST http://localhost:3000/shows/{show_id}/episodes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Episode 1",
    "description": "Our first episode"
  }'
```

### Upload Audio

```bash
curl -X POST http://localhost:3000/shows/{show_id}/episodes/{episode_id}/audio \
  -H "Authorization: Bearer <token>" \
  -F "audio=@podcast-episode.mp3"
```

### Publish Episode

```bash
curl -X POST http://localhost:3000/shows/{show_id}/episodes/{episode_id}/publish \
  -H "Authorization: Bearer <token>"
```

## Service Standard v1 Compliance

This service implements all Service Standard v1 requirements:

- ✅ **OpenAPI 3.0+** specification
- ✅ **OAuth2/OIDC** authentication with scopes
- ✅ **CloudEvents** for event publishing
- ✅ **AsyncAPI 2.0+** event specification
- ✅ **RFC 7807 Problem+JSON** error format
- ✅ **Structured JSON logging** with OpenTelemetry
- ✅ **Health endpoints** (`/healthz`, `/readyz`)
- ✅ **Service manifest** (`service.yaml`)
- ✅ **Environment-based configuration**

## Technology Stack

- **[Hono](https://hono.dev/)** - Ultra-fast web framework
- **[@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)** - Type-safe OpenAPI with Zod
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe SQL toolkit
- **[SQLite](https://www.sqlite.org/)** - Embedded database
- **[Zod](https://zod.dev/)** - Schema validation
- **[OpenTelemetry](https://opentelemetry.io/)** - Observability
- **[Winston](https://github.com/winstonjs/winston)** - Logging
- **[CloudEvents](https://cloudevents.io/)** - Event specification
