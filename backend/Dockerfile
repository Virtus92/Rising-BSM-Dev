FROM node:18-alpine

WORKDIR /app

# Install OpenSSL which is needed by Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install -g tsx

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate
 
# Set the DATABASE_URL environment variable for the build process
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/rising_bsm?schema=public

# Copy OpenAPI files first
COPY src/openapi ./src/openapi/
COPY scripts ./scripts/

# Create output directory
RUN mkdir -p dist

# Bundle OpenAPI files
RUN node ./scripts/bundle-openapi.js

# Copy the rest of the application
COPY . .

RUN chmod +x wait-for-db.sh

# Expose port and start application
EXPOSE 5000
CMD ["npm", "run", "build:dev"]