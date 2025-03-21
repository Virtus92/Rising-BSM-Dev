FROM node:18-alpine

WORKDIR /app

# Install OpenSSL which is needed by Prisma
RUN apk add --no-cache openssl

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install -g tsx

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate
 
# Set the DATABASE_URL environment variable for the build process
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/rising_bsm?schema=public

# Copy the rest of the application
COPY . .


RUN chmod +x wait-for-db.sh

# Expose port and start application
EXPOSE 5000
CMD ["npm", "run", "build:dev"]