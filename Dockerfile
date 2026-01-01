FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY package.json package-lock.json .pnp.cjs .pnp.loader.mjs ./

# Install dependencies (this layer will be cached if package files don't change)
RUN npm ci --only=production=false --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source files
COPY . .

# Build the application with placeholder values (will be replaced at runtime)
RUN VITE_API_URL=__VITE_API_URL__ \
    VITE_API_VERSION=__VITE_API_VERSION__ \
    VITE_ADMIN_EMAIL=__VITE_ADMIN_EMAIL__ \
    VITE_GOOGLE_PROJECT_ID=__VITE_GOOGLE_PROJECT_ID__ \
    VITE_GOOGLE_CLIENT_ID=__VITE_GOOGLE_CLIENT_ID__ \
    VITE_GOOGLE_CLIENT_SECRET=__VITE_GOOGLE_CLIENT_SECRET__ \
    VITE_GOOGLE_REDIRECT_URI=__VITE_GOOGLE_REDIRECT_URI__ \
    npm run build

# EXPOSE 80

# ---------- 2. Build backend and copy frontend build ----------
FROM node:20-alpine AS backend

WORKDIR /app

# Copy backend package files first for better layer caching
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production || npm install --production

# Copy backend source files
COPY backend/ ./

# Copy the built React files from previous stage
COPY --from=builder /app/frontend/dist ./dist

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the server port
EXPOSE 8080

# Health check (Cloud Run will use this for health monitoring)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the server
CMD ["/entrypoint.sh"]
