# Prisma Database Layer — Copilot Instructions

## Project Overview

This is a **pure database access layer** — not a web app, not an API server. It provides typed repositories, validation schemas, and error handling on top of Prisma ORM with PostgreSQL.

## Architecture

- **Repository Pattern**: `BaseRepository<T>` provides generic CRUD with cursor-based pagination. Each model gets a concrete repository extending it.
- **Error Mapping**: `mapPrismaError()` converts Prisma error codes (P2002, P2003, P2025) to typed `UniqueConstraintError`, `ForeignKeyError`, `NotFoundError`.
- **Validation**: Zod schemas validate input before it reaches the database. Schemas are separate from repositories — the caller is responsible for validating.
- **Factories**: Dual-purpose data builders used by both `prisma/seed.ts` and test files.
- **Client Singleton**: `src/client.ts` uses the `globalThis` pattern to prevent duplicate clients during hot-reload.

## Key Conventions

- **ESM only** (`"type": "module"` in package.json) — use `.js` extensions in imports even for `.ts` files.
- **Strict TypeScript** — no `any`, no implicit returns.
- **snake_case table names** via `@@map()` in Prisma schema, PascalCase model names.
- **Timestamp fields**: Every model should have `createdAt` and `updatedAt` with `@map("created_at")`.
- **Path alias**: `@/` maps to `src/` — use it in source files.

## When Adding a New Model

1. Add model to `prisma/schema.prisma` with timestamps, `@@map()`, and appropriate `@@index`.
2. Create `src/repositories/<model>.repository.ts` extending `BaseRepository`.
3. Create `src/validation/<model>.schema.ts` with Zod `create` and `update` schemas.
4. Create `src/factories/<model>.factory.ts` with `build*`, `create*`, `reset*Counter`.
5. Export everything from `src/index.ts`.
6. Add tests in `tests/repositories/` and update `tests/validation/schemas.test.ts`.

## Testing

- Tests use a separate `myapp_test` database (`.env.test`).
- Global setup pushes schema with `prisma db push --force-reset`.
- Each test file cleans the DB in `beforeEach` via `cleanDatabase()` from `tests/helpers.ts`.
- Factories reset counters in `beforeEach` for predictable data.
- Repository tests are integration tests — they hit a real PostgreSQL instance.
- Validation tests are pure unit tests — no DB needed.

## Do NOT

- Add HTTP/API/server code — this is a data layer only.
- Use `ts-node` — use `tsx` instead.
- Create a new PrismaClient in source files — import from `src/client.ts`.
- Skip error mapping — always wrap Prisma calls with `mapPrismaError`.
