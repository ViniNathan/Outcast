# =========================
# Base
# =========================
FROM oven/bun:1 AS base
WORKDIR /app

# =========================
# Dependencies
# =========================
FROM base AS deps
WORKDIR /app

# Root files
COPY package.json bun.lock ./

# Workspaces (somente package.json)
COPY apps ./apps
COPY packages ./packages

# Remove tudo que não for package.json (evita cache inválido)
RUN find apps packages -mindepth 2 -type f ! -name "package.json" -delete \
 && find apps packages -mindepth 2 -type d -empty -delete

# Install dependencies (determinístico)
RUN bun install --frozen-lockfile

# =========================
# Builder
# =========================
FROM base AS builder
WORKDIR /app

# Aceitar variáveis de ambiente durante o build (Railway injeta essas variáveis)
ARG DIRECT_URL
ARG DATABASE_URL

# Tornar as variáveis disponíveis durante o build
ENV DIRECT_URL=${DIRECT_URL}
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Reinstalar dependências para garantir que tudo está disponível (incluindo prisma/config)
RUN bun install --frozen-lockfile

# Prisma - usar o script do package.json que já está configurado
RUN bun run --filter @backend/db db:generate

# Build server
RUN bun run --filter server build

# =========================
# Runner (production)
# =========================
FROM oven/bun:1 AS runner
WORKDIR /app

# Em produção, mas precisamos das devDeps para o build se for rodar aqui
# ENV NODE_ENV=production 
ENV PORT=3000

# Copiar bun.lock para garantir resolução correta de workspaces
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/node_modules ./node_modules
# Copiar todo o código fonte dos apps e packages
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Roda o build e depois inicia
CMD bun run --filter server build && bun start
