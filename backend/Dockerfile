FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p public/uploads

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]

