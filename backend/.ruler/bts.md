# Better-T-Stack Project Rules

This is a backend project created with Better-T-Stack CLI.

## Project Structure

This is a monorepo with the following structure:

- **`apps/server/`** - Backend server (Elysia)

- **`packages/api/`** - Shared API logic and types
- **`packages/db/`** - Database schema and utilities
- **`packages/env/`** - Shared environment variables and validation
- **`packages/config/`** - Shared TypeScript configuration

## Available Scripts

- `bun run dev` - Start all apps in development mode
- `bun run dev:server` - Start only the server
- `bun run build` - Build all apps
- `bun run lint` - Lint all packages
- `bun run typecheck` - Type check all packages

## Database Commands

All database operations should be run from the server workspace:

- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open database studio
- `bun run db:generate` - Generate Prisma files
- `bun run db:migrate` - Run database migrations

Database schema is located in `packages/db/prisma/schema.prisma`

## API Structure

- tRPC routers are in `packages/api/src/routers/`
- Client-side tRPC utils are in `apps/web/src/utils/trpc.ts`

## Project Configuration

This project includes a `bts.jsonc` configuration file that stores your Better-T-Stack settings:

- Contains your selected stack configuration (database, ORM, backend, frontend, etc.)
- Used by the CLI to understand your project structure
- Safe to delete if not needed

## Key Points

- This is a monorepo using bun workspaces
- Each app has its own `package.json` and dependencies
- Run commands from the root to execute across all workspaces
- Run workspace-specific commands with `bun run command-name`
