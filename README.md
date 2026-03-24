# pphat-api

A production-grade RESTful API built with **Hono**, **Drizzle ORM**, and **Cloudflare Workers (D1)**, written in TypeScript with a modular backend architecture.

> **Live:** Deployed on Cloudflare Workers with D1 database (`pphat`)

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com/) |
| Framework | [Hono](https://hono.dev/) v4 |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) v0.43 |
| Validation | [Zod](https://zod.dev/) v4 |
| Auth | JWT (HS256) via [jose](https://github.com/panva/jose), [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs) |
| Language | TypeScript (ESNext) |

## Features

- Modular architecture — each domain has its own routes, controller, service, and validator
- JWT-based authentication with session management (env-configurable secret via `JWT_SECRET`)
- Role-based access control (`user` / `admin`)
- Soft-delete pattern across all entities
- Pagination, search, and sort on list endpoints
- CORS configuration with domain allowlist (`.pphat.top`, `.pphat.pro`)
- Drizzle ORM migrations with D1 support (5 migrations)
- Token refresh and revocation
- Auto-healing for missing tables via `POST /v1/api/setup`
- Safe body parsing for Cloudflare Workers (single-read stream handling)

## Project Structure

```
src/
├── index.ts                          # App entry point & route mounting
├── config/
│   └── index.ts                      # App configuration (JWT secret, CORS origins, getSecret helper)
├── middlewares/
│   ├── auth.ts                       # JWT authorization guard
│   ├── cors.ts                       # CORS middleware
│   └── db.ts                         # Drizzle D1 database middleware
├── shared/
│   ├── helpers/
│   │   └── db.helper.ts              # getTotal, paginate, isUnique
│   ├── types/
│   │   ├── articles.ts
│   │   ├── categories.ts
│   │   ├── projects.ts
│   │   ├── sessions.ts
│   │   └── users.ts
│   └── utils/
│       ├── json.ts                   # JSON parse + parseBody helper (CF Workers safe)
│       ├── response.ts               # Standardized API response class
│       └── validation.ts             # Shared Zod validators (list, get, delete, update, slug)
├── modules/
│   ├── articles/
│   │   ├── articles.routes.ts
│   │   ├── articles.controller.ts
│   │   ├── articles.service.ts
│   │   └── articles.validator.ts
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── categories/
│   │   ├── categories.routes.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── categories.validator.ts
│   ├── projects/
│   │   ├── projects.routes.ts
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   └── projects.validator.ts
│   ├── sessions/
│   │   ├── sessions.routes.ts
│   │   ├── sessions.controller.ts
│   │   ├── sessions.service.ts
│   │   └── sessions.validator.ts
│   └── users/
│       ├── users.routes.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── users.validator.ts
└── db/
    ├── schema.ts                     # Barrel export for all schemas
    ├── schema-helper.ts              # Legacy helper (getTotal, pagination, isUnique)
    ├── setup.ts                      # POST /setup — initialize all tables (uses raw D1 binding)
    └── schemas/
        ├── articles.ts
        ├── categories.ts
        ├── password-reset-tokens.ts
        ├── projects.ts
        ├── sessions.ts
        └── users.ts

drizzle/                              # SQL migrations and snapshots
│   ├── 0000_careless_microchip.sql
│   ├── 0001_condemned_meltdown.sql
│   ├── 0002_perfect_moonstone.sql
│   ├── 0003_dizzy_thunderball.sql
│   ├── 0004_add_moderators_to_articles.sql
│   ├── relations.ts
│   ├── schema.ts
│   └── meta/
```

## API Endpoints

All API routes are mounted under `/v1/api`.

### Authentication (`/v1/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/login` | — | Login and receive JWT |
| `POST` | `/auth/logout` | Bearer | Revoke current session |
| `POST` | `/auth/refresh` | Bearer | Refresh access token |
| `GET`  | `/auth/me` | Bearer | Get current user profile |
| `GET`  | `/auth/verify` | — | Verify token validity |

### Articles (`/v1/api/articles`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/articles` | — | List articles (paginated) |
| `GET` | `/articles/:slug` | — | Get article by slug |
| `POST` | `/articles` | Bearer | Create article |
| `PATCH` | `/articles/:id` | Bearer | Update article |
| `DELETE` | `/articles/:id` | Bearer | Soft-delete article |

> Alias: `/v1/api/posts` maps to the same articles module.

### Categories (`/v1/api/categories`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/categories` | — | List categories |
| `GET` | `/categories/:id` | — | Get category by ID |
| `POST` | `/categories` | Bearer | Create category |
| `PATCH` | `/categories/:id` | Bearer | Update category |
| `DELETE` | `/categories/:id` | Bearer | Soft-delete category |

### Projects (`/v1/api/projects`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/projects` | — | List projects |
| `GET` | `/projects/:id` | — | Get project by ID |
| `POST` | `/projects` | Bearer | Create project |
| `PATCH` | `/projects/:id` | Bearer | Update project |
| `DELETE` | `/projects/:id` | Bearer | Soft-delete project |

### Sessions (`/v1/api/sessions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/sessions` | — | List sessions |
| `GET` | `/sessions/:id` | — | Get session by ID |
| `POST` | `/sessions` | Bearer | Create session |
| `PATCH` | `/sessions/:id` | Bearer | Update session |
| `DELETE` | `/sessions/:id` | Bearer | Delete session |

### Users (`/v1/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users` | Bearer | List users |
| `GET` | `/users/:id` | Bearer | Get user by ID |
| `POST` | `/users` | Bearer | Create user |
| `PATCH` | `/users/:id` | Bearer | Update user |
| `DELETE` | `/users/:id` | Bearer | Soft-delete user |

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/v1/api/setup` | — | Initialize all database tables |
| `GET`  | `/` | — | Homepage |

### Query Parameters (List Endpoints)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 200) |
| `sort` | string | `id` | Sort field |
| `search` | string | — | Search term |
| `status` | boolean | `true` | Filter by active status |
| `is_deleted` | boolean | `false` | Include soft-deleted items |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) v4+
- A Cloudflare account with D1 access

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Deploy to Cloudflare

```bash
npm run deploy
```

### Database Migrations

```bash
# Generate migration from schema changes
npm run generate

# Push schema to remote D1
npm run push

# Pull remote schema locally
npm run pull
```

## Database Tables

| Table | Key Columns |
|-------|-------------|
| `users` | id, first_name, last_name, email, password, role, avatar |
| `articles` | id, title, slug, content, author_id (FK→users), category_id (FK→categories), moderators, tags |
| `categories` | id, name, slug, description |
| `projects` | id, name, description, image, tags (JSON), source (JSON), authors (JSON), languages (JSON) |
| `sessions` | id, user_id, token, expires_date, devices, ip_address |
| `password_reset_tokens` | id, user_id, token, expires_date |

All tables include `is_deleted`, `status`, `created_date`, and `updated_date` columns.

## Configuration

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Cloudflare Worker config (entry point, D1 binding) |
| `wrangler.toml` | Alternative Wrangler config |
| `drizzle.config.ts` | Drizzle ORM config (D1 HTTP driver) |
| `tsconfig.json` | TypeScript compiler options |
| `src/config/index.ts` | App-level config (JWT secret, CORS origins) |

### Environment Variables

Required in `.env` for Drizzle Kit migrations:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_d1_token
```

Worker environment variables (set via `wrangler secret` or dashboard):

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing (HS256) | `"default_secret"` |

## Architecture

```
Request → CORS → DB Middleware → [Auth Guard] → Validator → Controller → Service → DB
```

- **Routes** — Define HTTP methods and wire middleware + controller methods
- **Validators** — Zod schemas that parse and sanitize request input
- **Controllers** — Handle HTTP concerns (request/response), delegate to services
- **Services** — Business logic, database queries — framework-agnostic, receive `db` directly

### Key Patterns

- **`parseBody(c)`** — Safe body parser for Cloudflare Workers. The Workers runtime only allows the request body to be read once; this helper tries `json()` first, falls back to `parseBody()`, and avoids double-consume errors.
- **`getSecret(c)`** — Reads `JWT_SECRET` from the Worker environment with a fallback default. Used in auth middleware and token generation.
- **`POST /v1/api/setup`** — Initializes all 6 tables using raw D1 `prepare().run()` calls (not Drizzle), ensuring tables exist on first deploy.

## Seeding

Seed data can be applied to D1 using the provided SQL file:

```bash
# Seed projects to local D1
npx wrangler d1 execute pphat --local --file=seed-projects.sql

# Seed projects to remote D1
npx wrangler d1 execute pphat --remote --file=seed-projects.sql
```

## License

MIT