CREATE TABLE public.anfragen_notizen (
  id bigint primary key generated always as identity,
  anfrage_id integer NULL,
  benutzer_id integer NULL,
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT anfragen_notizen_anfrage_id_fkey FOREIGN KEY (anfrage_id) REFERENCES kontaktanfragen(id),
  CONSTRAINT anfragen_notizen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
);
ALTER TABLE public.anfragen_notizen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.benachrichtigungen (
  id bigint primary key generated always as identity,
  benutzer_id integer NULL,
  typ text NOT NULL,
  titel text NOT NULL,
  nachricht text NULL,
  referenz_id integer NULL,
  gelesen boolean NULL DEFAULT false,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT benachrichtigungen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
);
ALTER TABLE public.benachrichtigungen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.benutzer (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  email text NOT NULL,
  passwort text NOT NULL,
  rolle text NOT NULL DEFAULT 'mitarbeiter',
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aktualisiert_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT benutzer_email_key UNIQUE (email)
);
ALTER TABLE public.benutzer ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.benutzer_einstellungen (
  id bigint primary key generated always as identity,
  benutzer_id integer NULL,
  sprache text NULL DEFAULT 'de',
  dark_mode boolean NULL DEFAULT false,
  benachrichtigungen_email boolean NULL DEFAULT true,
  benachrichtigungen_intervall text NULL DEFAULT 'sofort',
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT benutzer_einstellungen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
);
ALTER TABLE public.benutzer_einstellungen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_ai_requests (
  id bigint primary key generated always as identity,
  topic text NOT NULL,
  keywords text NULL,
  target_audience text NULL,
  tone text NULL,
  status text NOT NULL DEFAULT 'pending',
  result_post_id integer NULL,
  requested_by integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp with time zone NULL,
  CONSTRAINT blog_ai_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES benutzer(id),
  CONSTRAINT blog_ai_requests_result_post_id_fkey FOREIGN KEY (result_post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
);
ALTER TABLE public.blog_ai_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_analytics (
  id bigint primary key generated always as identity,
  post_id integer NULL,
  views integer NOT NULL DEFAULT 0,
  unique_visitors integer NOT NULL DEFAULT 0,
  date date NOT NULL,
  CONSTRAINT blog_analytics_post_id_date_key UNIQUE (post_id, date),
  CONSTRAINT blog_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_categories (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  slug text NOT NULL,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_categories_slug_key UNIQUE (slug)
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_post_categories (
  post_id integer NOT NULL,
  category_id integer NOT NULL,
  CONSTRAINT blog_post_categories_pkey PRIMARY KEY (post_id, category_id),
  CONSTRAINT blog_post_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE,
  CONSTRAINT blog_post_categories_post_id_fkey FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_post_tags (
  post_id integer NOT NULL,
  tag_id integer NOT NULL,
  CONSTRAINT blog_post_tags_pkey PRIMARY KEY (post_id, tag_id),
  CONSTRAINT blog_post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  CONSTRAINT blog_post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
);
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_posts (
  id bigint primary key generated always as identity,
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  excerpt text NULL,
  featured_image text NULL,
  author_id integer NULL,
  published_at timestamp with time zone NULL,
  status text NOT NULL DEFAULT 'draft',
  seo_title text NULL,
  seo_description text NULL,
  seo_keywords text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_posts_slug_key UNIQUE (slug),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES benutzer(id)
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_seo_keywords (
  id bigint primary key generated always as identity,
  keyword text NOT NULL,
  search_volume integer NULL,
  current_ranking integer NULL,
  target_post_id integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_seo_keywords_target_post_id_fkey FOREIGN KEY (target_post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
);
ALTER TABLE public.blog_seo_keywords ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blog_tags (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_tags_slug_key UNIQUE (slug)
);
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE public.documents (
  id bigserial NOT NULL primary key,
  content text NULL,
  metadata jsonb NULL,
  embedding public.vector NULL
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kontaktanfragen (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  email text NOT NULL,
  phone text NULL,
  service text NOT NULL,
  message text NOT NULL,
  status text NULL DEFAULT 'neu',
  bearbeiter_id integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT kontaktanfragen_bearbeiter_id_fkey FOREIGN KEY (bearbeiter_id) REFERENCES benutzer(id)
);
ALTER TABLE public.kontaktanfragen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kontaktanfragen_old (
  id bigint generated by default as identity NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NULL,
  email text NULL,
  phone text NULL,
  service text NULL,
  message text NULL,
  CONSTRAINT kontaktanfragen_pkey PRIMARY KEY (id)
);
ALTER TABLE public.kontaktanfragen_old ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kunden (
  id bigint primary key generated always as identity,
  name text NOT NULL,
  firma text NULL,
  email text NULL,
  telefon text NULL,
  adresse text NULL,
  plz text NULL,
  ort text NULL,
  land text NULL DEFAULT 'Österreich',
  notizen text NULL,
  status text NULL DEFAULT 'aktiv',
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  kundentyp text NULL DEFAULT 'privat',
  newsletter boolean NULL DEFAULT false
);
ALTER TABLE public.kunden ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.projekte (
  id bigint primary key generated always as identity,
  titel text NOT NULL,
  kunde_id integer NULL,
  dienstleistung_id integer NULL,
  beschreibung text NULL,
  start_datum date NULL,
  end_datum date NULL,
  status text NULL DEFAULT 'neu',
  betrag numeric(10,2) NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT projekte_dienstleistung_id_fkey FOREIGN KEY (dienstleistung_id) REFERENCES dienstleistungen(id),
  CONSTRAINT projekte_kunde_id_fkey FOREIGN KEY (kunde_id) REFERENCES kunden(id)
);
ALTER TABLE public.projekte ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rechnungen (
  id bigint primary key generated always as identity,
  projekt_id integer NULL,
  kunde_id integer NULL,
  rechnungsnummer text NOT NULL,
  betrag numeric(10,2) NOT NULL,
  mwst_betrag numeric(10,2) NOT NULL,
  gesamtbetrag numeric(10,2) NOT NULL,
  rechnungsdatum date NOT NULL,
  faelligkeitsdatum date NOT NULL,
  status text NULL DEFAULT 'offen',
  bezahlt_am timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rechnungen_rechnungsnummer_key UNIQUE (rechnungsnummer),
  CONSTRAINT rechnungen_kunde_id_fkey FOREIGN KEY (kunde_id) REFERENCES kunden(id),
  CONSTRAINT rechnungen_projekt_id_fkey FOREIGN KEY (projekt_id) REFERENCES projekte(id)
);
ALTER TABLE public.rechnungen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rechnungspositionen (
  id bigint primary key generated always as identity,
  rechnung_id integer NULL,
  dienstleistung_id integer NULL,
  anzahl integer NOT NULL,
  einzelpreis numeric(10,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rechnungspositionen_dienstleistung_id_fkey FOREIGN KEY (dienstleistung_id) REFERENCES dienstleistungen(id),
  CONSTRAINT rechnungspositionen_rechnung_id_fkey FOREIGN KEY (rechnung_id) REFERENCES rechnungen(id)
);
ALTER TABLE public.rechnungspositionen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.termin_notizen (
  id bigint primary key generated always as identity,
  termin_id integer NULL,
  benutzer_id integer NULL,
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT termin_notizen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id),
  CONSTRAINT termin_notizen_termin_id_fkey FOREIGN KEY (termin_id) REFERENCES termine(id)
);
ALTER TABLE public.termin_notizen ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.termine (
  id bigint primary key generated always as identity,
  titel text NOT NULL,
  kunde_id integer NULL,
  projekt_id integer NULL,
  termin_datum timestamp with time zone NOT NULL,
  dauer integer NULL,
  ort text NULL,
  beschreibung text NULL,
  status text NULL DEFAULT 'geplant',
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  erstellt_von integer NULL,
  CONSTRAINT termine_erstellt_von_fkey FOREIGN KEY (erstellt_von) REFERENCES benutzer(id),
  CONSTRAINT termine_kunde_id_fkey FOREIGN KEY (kunde_id) REFERENCES kunden(id),
  CONSTRAINT termine_projekt_id_fkey FOREIGN KEY (projekt_id) REFERENCES projekte(id)
);
ALTER TABLE public.termine ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_sessions (
  sid text NOT NULL,
  sess json NOT NULL,
  expire timestamp with time zone NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON public.user_sessions USING btree (expire);

INSERT INTO public.benutzer (name, email, passwort, rolle, erstellt_am, aktualisiert_am)
VALUES ('Admin', 'admin@example.com', '$2y$12$r4Ucse3qbXN/kGavyQmokuYRLFGdHWRHB6VELvVdkyTzbub/jc3i.', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);