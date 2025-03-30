#!/bin/bash
set -e

# Dieser Skript wird während der Initialisierung des Postgres-Containers ausgeführt
# Es sorgt dafür, dass die Datenbank erstellt und mit den richtigen Berechtigungen konfiguriert wird

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Stelle sicher, dass die Datenbank existiert
    SELECT 'Database already exists' AS status;

    -- Erstelle Extensions, die Prisma benötigen könnte
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Setze Berechtigungen für den Datenbankbenutzer
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    
    -- Erstelle den _prisma_migrations-Eintrag falls noch nicht vorhanden
    DO \$\$
    BEGIN
        IF NOT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = '_prisma_migrations'
        ) THEN
            CREATE TABLE "_prisma_migrations" (
                id VARCHAR(36) NOT NULL,
                checksum VARCHAR(64) NOT NULL,
                finished_at TIMESTAMPTZ,
                migration_name VARCHAR(255) NOT NULL,
                logs TEXT,
                rolled_back_at TIMESTAMPTZ,
                started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                applied_steps_count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (id)
            );
        END IF;
    END
    \$\$;
EOSQL

echo "Datenbank-Initialisierung abgeschlossen."
