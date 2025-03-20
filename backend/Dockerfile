FROM node:18-alpine

WORKDIR /app

# Install OpenSSL which is needed by Prisma
RUN apk add --no-cache openssl

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma migrate dev --name init
RUN npx prisma generate

# Copy the rest of the application
COPY . .

RUN chmod +x wait-for-db.sh

# Expose port and start application
EXPOSE 5000
CMD ["npm", "run", "dev"]