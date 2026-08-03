# ==========================================
# STAGE 1: Build & Dependencies Pruning
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies (ignoring postinstall scripts for build safety)
RUN npm ci --ignore-scripts --only=production

# ==========================================
# STAGE 2: Production Lightweight Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create app directory with permissions for node user
RUN mkdir -p /app/uploads /app/public && chown -R node:node /app

# Copy node_modules from builder
COPY --chown=node:node --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY --chown=node:node . .

# Use non-root node user for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
