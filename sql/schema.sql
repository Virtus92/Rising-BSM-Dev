-- Schema für Rising BSM Dashboard-Datenbank

-- Benutzer
CREATE TABLE benutzer (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  passwort VARCHAR(100) NOT NULL,
  rolle VARCHAR(20) NOT NULL DEFAULT 'mitarbeiter',
  erstellt_am TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aktualisiert_am TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Kunden
CREATE TABLE kunden (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Dienstleistungen
CREATE TABLE dienstleistungen (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  beschreibung TEXT,
  preis_basis DECIMAL(10, 2),
  einheit VARCHAR(20),
  mwst_satz DECIMAL(5, 2) DEFAULT 20.00,
  aktiv BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Projekte/Aufträge
CREATE TABLE projekte (
  id SERIAL PRIMARY KEY,
  titel VARCHAR(200) NOT NULL,
  kunde_id INTEGER REFERENCES kunden(id),
  dienstleistung_id INTEGER REFERENCES dienstleistungen(id),
  beschreibung TEXT,
  start_datum DATE,
  end_datum DATE,
  status VARCHAR(20) DEFAULT 'neu',
  betrag DECIMAL(10, 2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rechnungen
CREATE TABLE rechnungen (
  id SERIAL PRIMARY KEY,
  projekt_id INTEGER REFERENCES projekte(id),
  kunde_id INTEGER REFERENCES kunden(id),
  rechnungsnummer VARCHAR(50) UNIQUE NOT NULL,
  betrag DECIMAL(10, 2) NOT NULL,
  mwst_betrag DECIMAL(10, 2) NOT NULL,
  gesamtbetrag DECIMAL(10, 2) NOT NULL,
  rechnungsdatum DATE NOT NULL,
  faelligkeitsdatum DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'offen',
  bezahlt_am TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Termine
CREATE TABLE termine (
  id SERIAL PRIMARY KEY,
  titel VARCHAR(200) NOT NULL,
  kunde_id INTEGER REFERENCES kunden(id),
  projekt_id INTEGER REFERENCES projekte(id),
  termin_datum TIMESTAMP NOT NULL,
  dauer INTEGER, -- in Minuten
  ort VARCHAR(200),
  beschreibung TEXT,
  status VARCHAR(20) DEFAULT 'geplant',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Kontaktanfragen
CREATE TABLE kontaktanfragen (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  service VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'neu',
  bearbeiter_id INTEGER REFERENCES benutzer(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Benachrichtigungen
CREATE TABLE benachrichtigungen (
  id SERIAL PRIMARY KEY,
  benutzer_id INTEGER REFERENCES benutzer(id),
  typ VARCHAR(20) NOT NULL,
  titel VARCHAR(100) NOT NULL,
  nachricht TEXT,
  referenz_id INTEGER,
  gelesen BOOLEAN DEFAULT FALSE,
  erstellt_am TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Einige typische Dienstleistungen einfügen
INSERT INTO dienstleistungen (name, beschreibung, preis_basis, einheit, mwst_satz, aktiv)
VALUES 
  ('Facility Management', 'Komplette Hausbetreuung inkl. Reinigung und Instandhaltung', 15.00, 'Stunde', 20.00, TRUE),
  ('Umzüge & Transporte', 'Privat- und Firmenumzüge sowie Gütertransporte', 85.00, 'Stunde', 20.00, TRUE),
  ('Winterdienst', 'Schneeräumung und Streuservice', 120.00, 'Monat', 20.00, TRUE);

-- Admin-Benutzer anlegen
INSERT INTO benutzer (name, email, passwort, rolle)
VALUES ('Admin', 'admin@rising-bsm.at', '$2a$10$SomeLongHashOhYikes...', 'admin');