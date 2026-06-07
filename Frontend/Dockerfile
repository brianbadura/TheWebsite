# =============================================================================
# Stage 1 – Build React frontend with Vite
# =============================================================================
FROM node:20-alpine AS build

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# =============================================================================
# Stage 2 – Serve static files with serve
# =============================================================================
FROM node:20-alpine
RUN npm install -g serve

COPY --from=build /build/dist /app

EXPOSE 80

CMD ["serve", "-s", "/app", "-l", "80"]