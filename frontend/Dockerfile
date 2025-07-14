# Multi-stage build for React frontend
FROM node:22.16.0-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (needed for build tools)
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM node:22.16.0-alpine AS development

# Install curl for health checks and python/make for native dependencies
RUN apk add --no-cache curl python3 make g++

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including devDependencies)
# Force reinstall to ensure correct architecture binaries
RUN npm ci --force

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start development server
# Install dependencies if node_modules doesn't exist, then start the server
CMD sh -c "if [ ! -d node_modules ]; then npm ci; fi && npx vite --host 0.0.0.0"