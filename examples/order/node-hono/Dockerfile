# Use the official Node.js 20 Alpine image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=base --chown=nextjs:nodejs /app/dist ./dist
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/package.json ./package.json

# Copy static files
COPY --chown=nextjs:nodejs openapi.yaml ./
COPY --chown=nextjs:nodejs asyncapi.yaml ./
COPY --chown=nextjs:nodejs service.yaml ./

# Switch to app user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/healthz', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
