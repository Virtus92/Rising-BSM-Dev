FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build Next.js app
RUN npm run build:docker

# Command to run the app
CMD ["npm", "start"]