# Build stage
FROM node:18 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG API_URL=http://localhost:3001
ARG BACKEND_PORT=3001
ARG FRONTEND_PORT=5173

# Set environment variables for the build
ENV API_URL=${API_URL}
ENV BACKEND_PORT=${BACKEND_PORT}
ENV FRONTEND_PORT=${FRONTEND_PORT}

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Nginx serves on port 80 by default
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
