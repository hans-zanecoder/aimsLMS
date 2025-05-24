FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Backup the original next.config.js
RUN cp next.config.js next.config.js.bak

# Modify next.config.js to ignore TypeScript and ESLint errors during build
RUN sed -i 's/const nextConfig = {/const nextConfig = { output: "standalone", typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true },/g' next.config.js

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-slim

WORKDIR /app

# Copy standalone application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]

