# node-with-cloudflare

A testing Cloudflare Worker API built with TypeScript, Hono, and Drizzle ORM for managing projects.

## Features

- RESTful API for project management (CRUD)
- TypeScript for type safety
- Hono framework for routing
- Drizzle ORM for database access
- Cloudflare Worker deployment via Wrangler

## Project Structure

```
src/
  controllers/         # API logic
  db/                  # Database schema and setup
  libs/                # Utilities
  middlewares/         # Middleware (e.g., Drizzle ORM)
  routes/              # API and web routes
  types/               # Type definitions
drizzle/               # SQL migrations and metadata
```

## API Endpoints

- `GET /api/projects` — List projects (pagination, search, sort)
- `POST /api/projects` — Create a new project
- `PATCH /api/projects/:id` — Update a project
- `DELETE /api/projects/:id` — Delete a project
- `POST /api/setup` — Initialize database

## Getting Started

### Prerequisites

- Node.js
- Wrangler CLI (`npm install -g wrangler`)
- SQLite (for local development)

### Install dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

## Configuration

- `wrangler.toml` — Cloudflare Worker settings
- `drizzle.config.ts` — Drizzle ORM config
- `tsconfig.json` — TypeScript config

## License

MIT