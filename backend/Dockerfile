FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript config
COPY tsconfig.json ./

# Copy prisma schema separately
COPY prisma ./prisma/

# Generate Prisma client before copying the rest of the app
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 5000

# Command to run the app
CMD ["npm", "run", "dev"]