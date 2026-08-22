# Single-stage build for Bun + Vite web app
FROM oven/bun:1.3.14-alpine AS base
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN bun install

# Build the web app
RUN cd packages/web && bun run build

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 4200

CMD ["bun", "run", "packages/web/src/__server.ts"]
