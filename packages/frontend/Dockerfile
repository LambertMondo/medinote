FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Source
COPY . .

# Build
RUN npm run build

# Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/next.config.ts ./

EXPOSE 3000
CMD ["npm", "start"]

# Development
FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "dev"]
