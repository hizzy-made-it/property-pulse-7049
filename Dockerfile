# Multi-stage build for Bun + Vite web app
FROM oven/bun:1.3.14-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
COPY packages/web/package.json ./packages/web/
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build the web app
RUN cd packages/web && bun run build

# Production stage
FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/web/dist ./packages/web/dist
COPY --from=base /app/packages/web/src ./packages/web/src
COPY --from=base /app/packages/web/package.json ./packages/web/
COPY --from=base /app/package.json ./
COPY --from=base /app/__ports.cjs ./

EXPOSE 4200

CMD ["bun", "run", "packages/web/src/__server.ts"]
