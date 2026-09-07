# ============================================================================
# HikeReady — production Dockerfile (Next.js standalone) for Google Cloud Run.
#
# Build:   docker build -t hikeready .
# Run:     docker run -p 3000:3000 --env-file .env hikeready
#
# Cloud Run listens on $PORT (defaults to 8080 there); Next standalone reads
# the PORT env var, so it works on both local (3000) and Cloud Run.
# ============================================================================

# ---- Stage 1: install dependencies ----------------------------------------
FROM node:20-alpine AS deps
# Prisma needs these on Alpine.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy manifests + prisma schema (postinstall runs `prisma generate`).
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Install exact, reproducible deps.
RUN npm ci

# ---- Stage 2: build the app ------------------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client (also runs via postinstall, but ensure it's fresh) + build.
RUN npx prisma generate
RUN npm run build

# ---- Stage 3: minimal runtime image ---------------------------------------
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run injects PORT; default to 8080 to match its convention.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Run as a non-root user for security.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server + its trimmed node_modules.
COPY --from=builder /app/.next/standalone ./
# Static assets and public files (not included in standalone by default).
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# JSON offline-fallback data (the app reads this if the DB is unavailable).
COPY --from=builder /app/data ./data
# Prisma schema + migrations + generated client (client lives in node_modules,
# already inside standalone; schema kept for reference/migrations).
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 8080

# The standalone build emits server.js at the project root.
CMD ["node", "server.js"]
