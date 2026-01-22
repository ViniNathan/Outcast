# Use Bun official image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bun run --filter @backend/db db:generate

# Build the server application
RUN bun run --filter server build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

# Expose the port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "--filter", "server", "start"]
