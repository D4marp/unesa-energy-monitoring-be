# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built node_modules and all backend files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose backend port (default 5000/5001)
EXPOSE 5000

CMD ["sh", "-c", "node scripts/db-init.js && node scripts/migrate_device_consumption.js && node server.js"]
