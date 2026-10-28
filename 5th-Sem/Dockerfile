# ─── Stage 1: Development ────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Copy package manifests and install all dependencies (including devDeps)
COPY package*.json ./
RUN npm install

# Copy Prisma schema first so prisma generate can run
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy remaining source files
COPY . .

EXPOSE 3000

# Start in watch mode for hot-reloading
CMD ["npm", "run", "start:dev"]


# ─── Stage 2: Production build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build


# ─── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
