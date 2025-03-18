-- Datenbank erstellen (falls noch nicht geschehen)
CREATE DATABASE rising_bsm;

-- In die Datenbank wechseln
\c rising_bsm;

-- Tabellen erstellen
CREATE TABLE dienstleistungen (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    beschreibung TEXT,
    preis_basis NUMERIC,
    mwst_satz NUMERIC DEFAULT 20.00,
    aktiv BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    einheit VARCHAR(20)
);

CREATE TABLE rechnungspositionen (
    id SERIAL PRIMARY KEY,
    rechnung_id INTEGER,
    dienstleistung_id INTEGER,
    anzahl INTEGER NOT NULL,
    einzelpreis NUMERIC NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anfragen_notizen (
    id SERIAL PRIMARY KEY,
    anfrage_id INTEGER,
    benutzer_id INTEGER,
    erstellt_am TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    benutzer_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL
);

CREATE TABLE termin_notizen (
    id SERIAL PRIMARY KEY,
    termin_id INTEGER,
    benutzer_id INTEGER,
    erstellt_am TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    benutzer_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL
);

CREATE TABLE kunden (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    newsletter BOOLEAN DEFAULT false,
    name VARCHAR(100) NOT NULL,
    firma VARCHAR(100),
    email VARCHAR(100),
    telefon VARCHAR(30),
    adresse TEXT,
    plz VARCHAR(10),
    ort VARCHAR(100),
    land VARCHAR(100) DEFAULT 'Österreich',
    notizen TEXT,
    status VARCHAR(20) DEFAULT 'aktiv',
    kundentyp VARCHAR(20) DEFAULT 'privat'
);

CREATE TABLE benutzer_einstellungen (
    id SERIAL PRIMARY KEY,
    benutzer_id INTEGER,
    dark_mode BOOLEAN DEFAULT false,
    benachrichtigungen_email BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    benachrichtigungen_push BOOLEAN DEFAULT false,
    sprache VARCHAR(10) DEFAULT 'de',
    benachrichtigungen_intervall VARCHAR(20) DEFAULT 'sofort'
);

CREATE TABLE kontaktanfragen_old (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    service VARCHAR,
    message TEXT
);

CREATE TABLE dienstleistungen_log (
    id SERIAL PRIMARY KEY,
    dienstleistung_id INTEGER NOT NULL,
    erstellt_am TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    benutzer_id INTEGER,
    aktion VARCHAR(255) NOT NULL,
    details TEXT,
    benutzer_name VARCHAR(255)
);

CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER,
    published_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT
);

CREATE TABLE blog_post_categories (
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, category_id)
);

CREATE TABLE blog_categories (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE blog_post_tags (
    post_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE blog_tags (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL
);

CREATE TABLE blog_seo_keywords (
    id SERIAL PRIMARY KEY,
    search_volume INTEGER,
    current_ranking INTEGER,
    target_post_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    keyword VARCHAR(255) NOT NULL
);

CREATE TABLE blog_analytics (
    id SERIAL PRIMARY KEY,
    post_id INTEGER,
    views INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL
);

CREATE TABLE blog_ai_requests (
    id SERIAL PRIMARY KEY,
    result_post_id INTEGER,
    requested_by INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    target_audience VARCHAR(100),
    tone VARCHAR(100),
    topic VARCHAR(255) NOT NULL,
    keywords TEXT
);

CREATE TABLE documents (
    id BIGINT PRIMARY KEY,
    metadata JSONB,
    embedding USER-DEFINED,
    content TEXT
);

CREATE TABLE rechnungen (
    id SERIAL PRIMARY KEY,
    projekt_id INTEGER,
    kunde_id INTEGER,
    betrag NUMERIC NOT NULL,
    mwst_betrag NUMERIC NOT NULL,
    gesamtbetrag NUMERIC NOT NULL,
    rechnungsdatum DATE NOT NULL,
    faelligkeitsdatum DATE NOT NULL,
    bezahlt_am TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'offen',
    rechnungsnummer VARCHAR(50) NOT NULL
);

CREATE TABLE user_sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE projekt_notizen (
    id BIGINT PRIMARY KEY,
    projekt_id INTEGER,
    benutzer_id INTEGER,
    erstellt_am TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    benutzer_name TEXT NOT NULL,
    text TEXT NOT NULL
);

CREATE TABLE kunden_log (
    id BIGINT PRIMARY KEY,
    kunde_id INTEGER NOT NULL,
    benutzer_id INTEGER,
    erstellt_am TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    benutzer_name TEXT NOT NULL,
    aktion TEXT NOT NULL,
    details TEXT
);

CREATE TABLE benutzer_aktivitaet (
    id SERIAL PRIMARY KEY,
    benutzer_id INTEGER NOT NULL,
    zeitstempel TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aktivitaet VARCHAR(255) NOT NULL,
    ip_adresse VARCHAR(255)
);

CREATE TABLE anfragen_log (
    id SERIAL PRIMARY KEY,
    anfrage_id INTEGER NOT NULL,
    benutzer_id INTEGER NOT NULL,
    erstellt_am TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    benutzer_name VARCHAR(255) NOT NULL,
    aktion VARCHAR(255) NOT NULL
);

CREATE TABLE projekte (
    id SERIAL PRIMARY KEY,
    kunde_id INTEGER,
    dienstleistung_id INTEGER,
    start_datum DATE,
    end_datum DATE,
    betrag NUMERIC,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    erstellt_von INTEGER,
    titel VARCHAR(200) NOT NULL,
    beschreibung TEXT,
    status VARCHAR(20) DEFAULT 'neu'
);

CREATE TABLE benutzer (
    id SERIAL PRIMARY KEY,
    erstellt_am TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    passwort VARCHAR(100) NOT NULL,
    rolle VARCHAR(20) NOT NULL DEFAULT 'mitarbeiter',
    telefon VARCHAR(30),
    status TEXT NOT NULL DEFAULT 'aktiv',
    profilbild VARCHAR(255)
);

CREATE TABLE termine (
    id SERIAL PRIMARY KEY,
    kunde_id INTEGER,
    projekt_id INTEGER,
    termin_datum TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    dauer INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    erstellt_von INTEGER,
    titel VARCHAR(200) NOT NULL,
    ort VARCHAR(200),
    beschreibung TEXT,
    status VARCHAR(20) DEFAULT 'geplant'
);

CREATE TABLE kontaktanfragen (
    id SERIAL PRIMARY KEY,
    bearbeiter_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    service VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'neu',
    ip_adresse VARCHAR(255)
);

CREATE TABLE termin_log (
    id BIGINT PRIMARY KEY,
    termin_id INTEGER NOT NULL,
    benutzer_id INTEGER NOT NULL,
    erstellt_am TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aktion TEXT NOT NULL,
    details TEXT,
    benutzer_name TEXT NOT NULL
);

CREATE TABLE benachrichtigungen (
    id SERIAL PRIMARY KEY,
    benutzer_id INTEGER,
    referenz_id INTEGER,
    gelesen BOOLEAN DEFAULT false,
    erstellt_am TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    typ VARCHAR(20) NOT NULL,
    titel VARCHAR(100) NOT NULL,
    nachricht TEXT,
    referenz_typ VARCHAR(50),
    beschreibung TEXT
);

-- Fremdschlüssel-Constraints hinzufügen
ALTER TABLE rechnungspositionen 
    ADD CONSTRAINT fk_rechnung 
    FOREIGN KEY (rechnung_id) REFERENCES rechnungen(id),
    
    ADD CONSTRAINT fk_dienstleistung 
    FOREIGN KEY (dienstleistung_id) REFERENCES dienstleistungen(id);

ALTER TABLE anfragen_notizen 
    ADD CONSTRAINT fk_anfrage 
    FOREIGN KEY (anfrage_id) REFERENCES kontaktanfragen(id),
    
    ADD CONSTRAINT fk_benutzer_anfragen 
    FOREIGN KEY (benutzer_id) REFERENCES benutzer(id);

ALTER TABLE projekte
    ADD CONSTRAINT fk_kunde
    FOREIGN KEY (kunde_id) REFERENCES kunden(id),
    
    ADD CONSTRAINT fk_dienstleistung_projekt
    FOREIGN KEY (dienstleistung_id) REFERENCES dienstleistungen(id),
    
    ADD CONSTRAINT fk_erstellt_von
    FOREIGN KEY (erstellt_von) REFERENCES benutzer(id);

ALTER TABLE blog_post_categories
    ADD CONSTRAINT fk_post
    FOREIGN KEY (post_id) REFERENCES blog_posts(id)
    ON DELETE CASCADE,
    
    ADD CONSTRAINT fk_category
    FOREIGN KEY (category_id) REFERENCES blog_categories(id)
    ON DELETE CASCADE;

ALTER TABLE rechnungen
    ADD CONSTRAINT fk_projekt
    FOREIGN KEY (projekt_id) REFERENCES projekte(id),
    
    ADD CONSTRAINT fk_kunde_rechnung
    FOREIGN KEY (kunde_id) REFERENCES kunden(id);

ALTER TABLE benutzer_einstellungen
    ADD CONSTRAINT fk_benutzer
    FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
    ON DELETE CASCADE;

-- Optionale Indexe für häufig genutzte Abfragen
CREATE INDEX idx_rechnungsdatum ON rechnungen(rechnungsdatum);
CREATE INDEX idx_termin_datum ON termine(termin_datum);
CREATE INDEX idx_blog_post_status ON blog_posts(status);

-- Benutzer und Rechte setzen
CREATE USER rising_bsm WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rising_bsm TO rising_bsm;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rising_bsm;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rising_bsm;