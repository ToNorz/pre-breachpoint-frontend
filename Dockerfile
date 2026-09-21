# Stage 1: Build the Vite application
FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies with frozen lockfile
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build-time environment variables for Vite
ARG VITE_API_BASE_URL=/
ARG VITE_EVENT_SLUG=breachpoint-2026-r1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_EVENT_SLUG=$VITE_EVENT_SLUG

# Build the production bundle
RUN bun run build

# Stage 2: Serve with high-performance Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
