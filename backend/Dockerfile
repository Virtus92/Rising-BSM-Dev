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

# Copy Swagger configuration
COPY config/swagger* ./config/

# Copy the rest of the application
COPY . .

# For production builds, optionally pre-generate the Swagger docs
RUN if [ "$NODE_ENV" = "production" ]; then \
    node -e "const swaggerJsdoc = require('swagger-jsdoc'); \
    const config = require('./config/swagger.config.js'); \
    const swaggerSpec = swaggerJsdoc(config); \
    require('fs').writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));" \
    ; fi

RUN chmod +x wait-for-db.sh
RUN chmod +x docker-entrypoint.sh

# Expose port and start application
EXPOSE 5000
CMD ["npm", "run", "build:dev"]