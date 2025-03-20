FROM node:18-bookworm

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema first
COPY tsconfig.json ./
COPY prisma ./prisma/

# Update schema for the correct OpenSSL version
RUN sed -i 's/binaryTargets = \[.*\]/binaryTargets = ["native", "windows", "debian-openssl-3.0.x"]/g' ./prisma/schema.prisma || echo "Sed command failed, check your schema.prisma file format"

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 5000

# Command to run the app
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "server.ts"]


# Für Produktion
# CMD ["npm", "start"]