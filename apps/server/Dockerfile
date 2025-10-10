# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.5.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files to install dependencies
COPY apps/server/package.json ./apps/server/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/games/package.json ./packages/games/package.json
COPY packages/party/package.json ./packages/party/package.json
COPY packages/user/package.json ./packages/user/package.json
COPY packages/notifications/package.json ./packages/notifications/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server
COPY packages ./packages
COPY turbo.json ./turbo.json

# Generate Prisma client
RUN pnpm --filter @phone-games/db run db:generate

# Build packages in order (to handle TypeScript composite references)
RUN pnpm --filter @phone-games/db run build && \
    pnpm --filter @phone-games/games run build && \
    pnpm --filter @phone-games/user run build && \
    pnpm --filter @phone-games/notifications run build && \
    pnpm --filter @phone-games/party run build && \
    pnpm --filter @phone-games/server run build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.5.0 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for production install
COPY apps/server/package.json ./apps/server/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/games/package.json ./packages/games/package.json
COPY packages/party/package.json ./packages/party/package.json
COPY packages/user/package.json ./packages/user/package.json
COPY packages/notifications/package.json ./packages/notifications/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built packages from builder
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/games/dist ./packages/games/dist
COPY --from=builder /app/packages/party/dist ./packages/party/dist
COPY --from=builder /app/packages/user/dist ./packages/user/dist
COPY --from=builder /app/packages/notifications/dist ./packages/notifications/dist

# Copy built server
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "apps/server/dist/server.js"]
