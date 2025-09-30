# Stage 1: Dependencies & Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package.json dan install dependencies
COPY package*.json ./
RUN npm install

# Copy sisa source code dan build aplikasi
COPY . .
RUN npm run build

# Stage 2: Production Image
FROM node:18-alpine
WORKDIR /app

# Copy hasil build dari stage builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose port yang digunakan oleh Next.js
EXPOSE 3000

# Command untuk menjalankan aplikasi
CMD ["node", "server.js"]