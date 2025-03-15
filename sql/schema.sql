CREATE TABLE public.benutzer (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  passwort text NOT NULL,
  rolle text NOT NULL DEFAULT 'mitarbeiter',
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aktualisiert_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  telefon text NULL,
  status text NOT NULL DEFAULT 'aktiv',
  profilbild text NULL
);
ALTER TABLE public.benutzer ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kunden (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  firma text NULL,
  email text NULL,
  telefon text NULL,
  adresse text NULL,
  plz text NULL,
  ort text NULL,
  land text NOT NULL DEFAULT 'Österreich',
  notizen text NULL,
  status text NOT NULL DEFAULT 'aktiv',
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  kundentyp text NOT NULL DEFAULT 'privat',
  newsletter boolean NULL DEFAULT false
);
ALTER TABLE public.kunden ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.projekte (
  id bigint primary key generated always as identity,
  titel text NOT NULL,
  kunde_id bigint NULL REFERENCES public.kunden(id),
  dienstleistung_id bigint NULL REFERENCES public.dienstleistungen(id),
  beschreibung text NULL,
  start_datum timestamp with time zone NULL,
  end_datum timestamp with time zone NULL,
  status text NOT NULL DEFAULT 'neu',
  betrag numeric(10,2) NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.projekte ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rechnungen (
  id bigint primary key generated always as identity,
  projekt_id bigint NULL REFERENCES public.projekte(id),
  kunde_id bigint NULL REFERENCES public.kunden(id),
  rechnungsnummer text NOT NULL UNIQUE,
  betrag numeric(10,2) NOT NULL,
  mwst_betrag numeric(10,2) NOT NULL,
  gesamtbetrag numeric(10,2) NOT NULL,
  rechnungsdatum timestamp with time zone NOT NULL,
  faelligkeitsdatum timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'offen',
  bezahlt_am timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.rechnungen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rechnungspositionen (
  id bigint primary key generated always as identity,
  rechnung_id bigint NULL REFERENCES public.rechnungen(id),
  dienstleistung_id bigint NULL REFERENCES public.dienstleistungen(id),
  anzahl integer NOT NULL,
  einzelpreis numeric(10,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.rechnungspositionen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dienstleistungen (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  beschreibung text NULL,
  preis_basis numeric(10,2) NULL,
  einheit text NULL,
  mwst_satz numeric(5,2) NULL DEFAULT 20.00,
  aktiv boolean NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.dienstleistungen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kontaktanfragen (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  email text NOT NULL,
  phone text NULL,
  service text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  bearbeiter_id bigint NULL REFERENCES public.benutzer(id),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_adresse text NULL
);
ALTER TABLE public.kontaktanfragen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_posts (
  id bigint primary key generated always as identity,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text NULL,
  featured_image text NULL,
  author_id bigint NULL REFERENCES public.benutzer(id),
  published_at timestamp with time zone NULL,
  status text NOT NULL DEFAULT 'draft',
  seo_title text NULL,
  seo_description text NULL,
  seo_keywords text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_categories (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_tags (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_post_categories (
  post_id bigint NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id bigint NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_post_tags (
  post_id bigint NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id bigint NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.documents (
  id bigserial primary key,
  content text NULL,
  metadata jsonb NULL,
  embedding vector(384) NULL
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.benachrichtigungen (
  id bigint primary key generated always as identity,
  benutzer_id bigint NULL REFERENCES public.benutzer(id),
  typ text NOT NULL,
  titel text NOT NULL,
  nachricht text NULL,
  referenz_id bigint NULL,
  gelesen boolean NULL DEFAULT false,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  beschreibung text NULL,
  referenz_typ text NULL
);
ALTER TABLE public.benachrichtigungen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.anfragen_log (
  id bigint primary key generated always as identity,
  anfrage_id bigint NOT NULL,
  benutzer_id bigint NOT NULL,
  benutzer_name text NOT NULL,
  aktion text NOT NULL,
  details text NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.anfragen_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.anfragen_notizen (
  id bigint primary key generated always as identity,
  anfrage_id bigint NULL REFERENCES public.kontaktanfragen(id),
  benutzer_id bigint NULL REFERENCES public.benutzer(id),
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.anfragen_notizen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_ai_requests (
  id bigint primary key generated always as identity,
  topic text NOT NULL,
  keywords text NULL,
  target_audience text NULL,
  tone text NULL,
  status text NOT NULL DEFAULT 'pending',
  result_post_id bigint NULL REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  requested_by bigint NULL REFERENCES public.benutzer(id),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp with time zone NULL
);
ALTER TABLE public.blog_ai_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_analytics (
  id bigint primary key generated always as identity,
  post_id bigint NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  views integer NOT NULL DEFAULT 0,
  unique_visitors integer NOT NULL DEFAULT 0,
  date date NOT NULL,
  UNIQUE (post_id, date)
);
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kunden_log (
  id bigint primary key generated always as identity,
  kunde_id bigint NOT NULL REFERENCES public.kunden(id),
  benutzer_id bigint NULL REFERENCES public.benutzer(id),
  benutzer_name text NOT NULL,
  aktion text NOT NULL,
  details text NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.kunden_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.projekt_notizen (
  id bigint primary key generated always as identity,
  projekt_id bigint NULL REFERENCES public.projekte(id),
  benutzer_id bigint NULL REFERENCES public.benutzer(id),
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.projekt_notizen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.termin_log (
  id bigint primary key generated always as identity,
  termin_id bigint NOT NULL,
  benutzer_id bigint NOT NULL REFERENCES public.benutzer(id),
  aktion text NOT NULL,
  details text NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  benutzer_name text NOT NULL
);
ALTER TABLE public.termin_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.termin_notizen (
  id bigint primary key generated always as identity,
  termin_id bigint NULL REFERENCES public.termine(id),
  benutzer_id bigint NULL REFERENCES public.benutzer(id),
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.termin_notizen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.termine (
  id bigint primary key generated always as identity,
  titel text NOT NULL,
  kunde_id bigint NULL REFERENCES public.kunden(id),
  projekt_id bigint NULL REFERENCES public.projekte(id),
  termin_datum timestamp with time zone NOT NULL,
  dauer integer NULL,
  ort text NULL,
  beschreibung text NULL,
  status text NOT NULL DEFAULT 'geplant',
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.termine ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_sessions (
  sid text NOT NULL,
  sess json NOT NULL,
  expire timestamp with time zone NOT NULL,
  PRIMARY KEY (sid)
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

INSERT INTO public.benutzer (name, email, passwort, rolle, erstellt_am, aktualisiert_am)
VALUES ('Admin', 'admin@example.com', '$2y$12$r4Ucse3qbXN/kGavyQmokuYRLFGdHWRHB6VELvVdkyTzbub/jc3i.', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);