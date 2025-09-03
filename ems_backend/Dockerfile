FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json first (for caching npm install)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all code
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "server.js"]
