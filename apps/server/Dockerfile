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
COPY packages/errors/package.json ./packages/errors/package.json
COPY packages/games/package.json ./packages/games/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/party/package.json ./packages/party/package.json
COPY packages/user/package.json ./packages/user/package.json
COPY packages/notifications/package.json ./packages/notifications/package.json
COPY packages/messaging/package.json ./packages/messaging/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server
COPY packages ./packages
COPY turbo.json ./turbo.json

# Generate Prisma client
RUN pnpm --filter @phone-games/db run db:generate

# Build packages in order (to handle TypeScript composite references)
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm and Prisma CLI globally
RUN corepack enable && corepack prepare pnpm@10.5.0 --activate && \
    npm install -g prisma@6.16.2

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for production install
COPY apps/server/package.json ./apps/server/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/errors/package.json ./packages/errors/package.json
COPY packages/games/package.json ./packages/games/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/party/package.json ./packages/party/package.json
COPY packages/user/package.json ./packages/user/package.json
COPY packages/notifications/package.json ./packages/notifications/package.json
COPY packages/messaging/package.json ./packages/messaging/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema for migrations
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# Copy built packages from builder
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/errors/dist ./packages/errors/dist
COPY --from=builder /app/packages/games/dist ./packages/games/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/party/dist ./packages/party/dist
COPY --from=builder /app/packages/user/dist ./packages/user/dist
COPY --from=builder /app/packages/notifications/dist ./packages/notifications/dist
COPY --from=builder /app/packages/messaging/dist ./packages/messaging/dist

# Copy built server
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "apps/server/dist/server.js"]
