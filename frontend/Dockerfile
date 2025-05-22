FROM node:18-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-slim

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]

