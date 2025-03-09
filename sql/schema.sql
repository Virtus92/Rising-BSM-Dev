CREATE TABLE public.anfragen_notizen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  anfrage_id integer NULL,
  benutzer_id integer NULL,
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT anfragen_notizen_pkey PRIMARY KEY (id),
  CONSTRAINT anfragen_notizen_anfrage_id_fkey FOREIGN KEY (anfrage_id) REFERENCES kontaktanfragen(id),
  CONSTRAINT anfragen_notizen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
);

CREATE TABLE public.benachrichtigungen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  benutzer_id integer NULL,
  typ text NOT NULL,
  titel text NOT NULL,
  nachricht text NULL,
  referenz_id integer NULL,
  gelesen boolean NULL DEFAULT false,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT benachrichtigungen_pkey PRIMARY KEY (id),
  CONSTRAINT benachrichtigungen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
);

CREATE TABLE public.benutzer (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  passwort text NOT NULL,
  rolle text NOT NULL DEFAULT 'mitarbeiter',
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aktualisiert_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT benutzer_pkey PRIMARY KEY (id),
  CONSTRAINT benutzer_email_key UNIQUE (email)
);

CREATE TABLE public.benutzer_einstellungen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  benutzer_id integer NULL,
  sprache text NULL DEFAULT 'de',
  dark_mode boolean NULL DEFAULT false,
  benachrichtigungen_email boolean NULL DEFAULT true,
  benachrichtigungen_intervall text NULL DEFAULT 'sofort',
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT benutzer_einstellungen_pkey PRIMARY KEY (id),
  CONSTRAINT benutzer_einstellungen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
);

CREATE TABLE public.blog_ai_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  topic text NOT NULL,
  keywords text NULL,
  target_audience text NULL,
  tone text NULL,
  status text NOT NULL DEFAULT 'pending',
  result_post_id integer NULL,
  requested_by integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp with time zone NULL,
  CONSTRAINT blog_ai_requests_pkey PRIMARY KEY (id),
  CONSTRAINT blog_ai_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES benutzer(id),
  CONSTRAINT blog_ai_requests_result_post_id_fkey FOREIGN KEY (result_post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
);

CREATE TABLE public.blog_analytics (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id integer NULL,
  views integer NOT NULL DEFAULT 0,
  unique_visitors integer NOT NULL DEFAULT 0,
  date date NOT NULL,
  CONSTRAINT blog_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT blog_analytics_post_id_date_key UNIQUE (post_id, date),
  CONSTRAINT blog_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

CREATE TABLE public.blog_categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_categories_pkey PRIMARY KEY (id),
  CONSTRAINT blog_categories_slug_key UNIQUE (slug)
);

CREATE TABLE public.blog_post_categories (
  post_id integer NOT NULL,
  category_id integer NOT NULL,
  CONSTRAINT blog_post_categories_pkey PRIMARY KEY (post_id, category_id),
  CONSTRAINT blog_post_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE,
  CONSTRAINT blog_post_categories_post_id_fkey FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);

CREATE TABLE public.blog_post_tags (
  post_id integer NOT NULL,
  tag_id integer NOT NULL,
  CONSTRAINT blog_post_tags_pkey PRIMARY KEY (post_id, tag_id),
  CONSTRAINT blog_post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  CONSTRAINT blog_post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
);

CREATE TABLE public.blog_posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
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
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_slug_key UNIQUE (slug),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES benutzer(id)
);

CREATE TABLE public.blog_seo_keywords (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  keyword text NOT NULL,
  search_volume integer NULL,
  current_ranking integer NULL,
  target_post_id integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_seo_keywords_pkey PRIMARY KEY (id),
  CONSTRAINT blog_seo_keywords_target_post_id_fkey FOREIGN KEY (target_post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
);

CREATE TABLE public.blog_tags (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT blog_tags_pkey PRIMARY KEY (id),
  CONSTRAINT blog_tags_slug_key UNIQUE (slug)
);

CREATE TABLE public.dienstleistungen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  beschreibung text NULL,
  preis_basis numeric(10,2) NULL,
  einheit text NULL,
  mwst_satz numeric(5,2) NULL DEFAULT 20.00,
  aktiv boolean NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT dienstleistungen_pkey PRIMARY KEY (id)
);

CREATE TABLE public.documents (
  id bigserial NOT NULL,
  content text NULL,
  metadata jsonb NULL,
  embedding public.vector NULL,
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

CREATE TABLE public.kontaktanfragen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NULL,
  service text NOT NULL,
  message text NOT NULL,
  status text NULL DEFAULT 'neu',
  bearbeiter_id integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT kontaktanfragen_pkey1 PRIMARY KEY (id),
  CONSTRAINT kontaktanfragen_bearbeiter_id_fkey FOREIGN KEY (bearbeiter_id) REFERENCES benutzer(id)
);

CREATE TABLE public.kontaktanfragen_old (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NULL,
  email text NULL,
  phone text NULL,
  service text NULL,
  message text NULL,
  CONSTRAINT kontaktanfragen_pkey PRIMARY KEY (id)
);

CREATE TABLE public.kunden (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
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
  newsletter boolean NULL DEFAULT false,
  CONSTRAINT kunden_pkey PRIMARY KEY (id)
);

CREATE TABLE public.projekt_notizen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  projekt_id integer NULL,
  benutzer_id integer NULL,
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT projekt_notizen_pkey PRIMARY KEY (id),
  CONSTRAINT projekt_notizen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id),
  CONSTRAINT projekt_notizen_projekt_id_fkey FOREIGN KEY (projekt_id) REFERENCES projekte(id)
);

CREATE TABLE public.projekte (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
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
  erstellt_von integer NULL,
  CONSTRAINT projekte_pkey PRIMARY KEY (id),
  CONSTRAINT projekte_dienstleistung_id_fkey FOREIGN KEY (dienstleistung_id) REFERENCES dienstleistungen(id),
  CONSTRAINT projekte_kunde_id_fkey FOREIGN KEY (kunde_id) REFERENCES kunden(id)
);

CREATE TABLE public.rechnungen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
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
  CONSTRAINT rechnungen_pkey PRIMARY KEY (id),
  CONSTRAINT rechnungen_rechnungsnummer_key UNIQUE (rechnungsnummer),
  CONSTRAINT rechnungen_kunde_id_fkey FOREIGN KEY (kunde_id) REFERENCES kunden(id),
  CONSTRAINT rechnungen_projekt_id_fkey FOREIGN KEY (projekt_id) REFERENCES projekte(id)
);

CREATE TABLE public.rechnungspositionen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  rechnung_id integer NULL,
  dienstleistung_id integer NULL,
  anzahl integer NOT NULL,
  einzelpreis numeric(10,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rechnungspositionen_pkey PRIMARY KEY (id),
  CONSTRAINT rechnungspositionen_dienstleistung_id_fkey FOREIGN KEY (dienstleistung_id) REFERENCES dienstleistungen(id),
  CONSTRAINT rechnungspositionen_rechnung_id_fkey FOREIGN KEY (rechnung_id) REFERENCES rechnungen(id)
);

CREATE TABLE public.termin_notizen (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  termin_id integer NULL,
  benutzer_id integer NULL,
  benutzer_name text NOT NULL,
  text text NOT NULL,
  erstellt_am timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT termin_notizen_pkey PRIMARY KEY (id),
  CONSTRAINT termin_notizen_benutzer_id_fkey FOREIGN KEY (benutzer_id) REFERENCES benutzer(id),
  CONSTRAINT termin_notizen_termin_id_fkey FOREIGN KEY (termin_id) REFERENCES termine(id)
);

CREATE TABLE public.termine (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
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
  CONSTRAINT termine_pkey PRIMARY KEY (id),
  CONSTRAINT termine_erstellt_von_fkey FOREIGN KEY (erstellt_von) REFERENCES benutzer(id),
  CONSTRAINT termine_kunde_id_fkey FOREIGN KEY (kunde_id) REFERENCES kunden(id),
  CONSTRAINT termine_projekt_id_fkey FOREIGN KEY (projekt_id) REFERENCES projekte(id)
);

CREATE TABLE public.user_sessions (
  sid text NOT NULL,
  sess json NOT NULL,
  expire timestamp with time zone NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE POLICY "Benutzer können ihre eigenen Anfragen sehen" 
ON public.kontaktanfragen 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = bearbeiter_id);

CREATE POLICY "Benutzer sehen nur eigene Benachrichtigungen" 
ON public.benachrichtigungen 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = benutzer_id);

CREATE POLICY "Benutzer sehen nur eigene Notizen" 
ON public.projekt_notizen 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = benutzer_id);

CREATE POLICY "Benutzer sehen nur eigene Rechnungen" 
ON public.rechnungen 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = kunde_id);

CREATE POLICY "Benutzer sehen nur eigene Blog-Posts" 
ON public.blog_posts 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = author_id);

CREATE POLICY "Benutzer sehen nur eigene Einstellungen" 
ON public.benutzer_einstellungen 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = benutzer_id);

CREATE POLICY "Benutzer sehen nur eigene Termin Notizen" 
ON public.termin_notizen 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = benutzer_id);

CREATE POLICY "Benutzer sehen nur eigene Rechnungspositionen" 
ON public.rechnungspositionen 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = rechnung_id);

CREATE POLICY "Benutzer sehen nur eigene Termine" 
ON public.termine 
FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = erstellt_von);

CREATE POLICY "Admins können alles mit Kunden machen" 
ON public.kunden 
FOR ALL 
TO authenticated 
USING ((auth.jwt() ->> 'rolle') = 'admin');

INSERT INTO public.benutzer (name, email, passwort, rolle, erstellt_am, aktualisiert_am)
VALUES ('Admin', 'admin@example.com', '$2y$12$r4Ucse3qbXN/kGavyQmokuYRLFGdHWRHB6VELvVdkyTzbub/jc3i.', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);