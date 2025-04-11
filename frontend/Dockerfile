# Build Stage
FROM node:23-alpine AS builder

WORKDIR /app

# Install necessary tools
RUN apk --no-cache add curl bash openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema, migrations, and seed files
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy rest of the application code
COPY . .

# Build Next.js app
RUN npm run build

# Production Stage
FROM node:23-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Install runtime dependencies
RUN apk --no-cache add curl bash && \
    chmod 755 /bin/bash

# Copy prisma
COPY prisma ./prisma/
# Copy entry point script
COPY docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh

# Copy built app from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js

# Generate Prisma client
RUN npx prisma generate

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE $PORT

# Use non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

# Set up entry point to handle migrations and start app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
