FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
# This is important because mongodb-memory-server is in devDependencies
# but is used in the production code for fallback
RUN npm install

# Copy application code
COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p public/uploads

# Expose the port the app runs on
EXPOSE 8080

# Set environment variable for PORT
ENV PORT=8080

# Command to run the application
CMD ["node", "src/index.js"]

