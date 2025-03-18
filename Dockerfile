FROM node:18-alpine AS builder
WORKDIR /app

# Vorhandene npm-Version verwenden
RUN npm install -g npm@10.8.2

# Kopieren Sie package-Dateien
COPY package*.json ./

# Installieren Sie Abhängigkeiten
RUN npm install

# Kopieren Sie restliche Dateien
COPY . .

# Produktions-Stage
FROM node:18-alpine
WORKDIR /app

# Kopieren Sie notwendige Dateien
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

EXPOSE 3000
CMD ["npm", "start"]