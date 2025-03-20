FROM node:18-slim

# Debian-basierte Pakete für Prisma installieren
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Kopieren Sie package.json und package-lock.json
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# TypeScript-Konfiguration kopieren
COPY tsconfig.json ./

# Prisma-Schema kopieren
COPY prisma ./prisma/

# Prisma Client generieren
RUN npx prisma generate

# Den Rest der App kopieren
COPY . .

# TypeScript-Code kompilieren
RUN npm run build

# Port freigeben
EXPOSE 5000

# Für Entwicklung
CMD ["npm", "run", "dev"]

# Für Produktion
# CMD ["npm", "start"]