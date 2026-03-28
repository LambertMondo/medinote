FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
COPY package.json ./
RUN npm install

# Source
COPY . .

# Build
RUN npm run build

# Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]

# Development
FROM base AS development
EXPOSE 3001
CMD ["npm", "run", "start:dev"]
