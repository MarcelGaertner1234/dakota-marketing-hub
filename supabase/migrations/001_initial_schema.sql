-- Dakota Marketing Hub — Complete DB Schema
-- No Auth/RLS — internal team tool

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE event_type AS ENUM ('own_event', 'local_event', 'holiday', 'concept_event');
CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'overdue');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE lead_type AS ENUM ('verein', 'firma', 'privatperson', 'behoerde', 'medien');
CREATE TYPE lead_status AS ENUM ('neu', 'kontaktiert', 'interessiert', 'gebucht', 'nachfassen', 'verloren');
CREATE TYPE platform_type AS ENUM ('instagram', 'facebook', 'tiktok');
CREATE TYPE post_status AS ENUM ('draft', 'planned', 'ready', 'published');

-- ============================================
-- TEAM MEMBERS
-- ============================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONCEPTS (before events, since events reference concepts)
-- ============================================

CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_berndeutsch TEXT,
  target_audience TEXT,
  channels TEXT[],
  menu_description TEXT,
  price_range TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS (Marketing Calendar)
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'own_event',
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT DEFAULT 'Dakota Air Lounge',
  color TEXT,
  concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  recurrence recurrence_type DEFAULT 'none',
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  lead_time_days INTEGER DEFAULT 28,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(start_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_concept ON events(concept_id);

-- ============================================
-- TASKS (per Event)
-- ============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES team_members(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_event ON tasks(event_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================
-- EVENT IMAGES
-- ============================================

CREATE TABLE event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  caption TEXT,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_images_event ON event_images(event_id);

-- ============================================
-- LEADS
-- ============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  lead_type lead_type NOT NULL DEFAULT 'privatperson',
  email TEXT,
  phone TEXT,
  address TEXT,
  status lead_status DEFAULT 'neu',
  notes TEXT,
  tags TEXT[],
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_type ON leads(lead_type);

-- ============================================
-- LEAD ACTIVITIES (Contact History)
-- ============================================

CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  contacted_by UUID REFERENCES team_members(id),
  contacted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);

-- ============================================
-- LEAD ↔ EVENT (n:m)
-- ============================================

CREATE TABLE lead_events (
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'eingeladen',
  notes TEXT,
  PRIMARY KEY (lead_id, event_id)
);

-- ============================================
-- SOCIAL POSTS
-- ============================================

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  platform platform_type NOT NULL,
  post_type TEXT DEFAULT 'post',
  title TEXT,
  caption TEXT,
  hashtags TEXT[],
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status post_status DEFAULT 'draft',
  series_id UUID,
  series_order INTEGER,
  assigned_to UUID REFERENCES team_members(id),
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_event ON social_posts(event_id);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_at);
CREATE INDEX idx_social_posts_status ON social_posts(status);

CREATE TABLE social_post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEWS (Guest Ratings)
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  food_rating INTEGER CHECK (food_rating BETWEEN 1 AND 5),
  ambience_rating INTEGER CHECK (ambience_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  comment TEXT,
  guest_name TEXT,
  guest_email TEXT,
  goody_claimed BOOLEAN DEFAULT FALSE,
  goody_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_token ON reviews(token);

-- ============================================
-- HOLIDAYS (Swiss / Canton Bern)
-- ============================================

CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_national BOOLEAN DEFAULT FALSE,
  canton TEXT DEFAULT 'BE',
  year INTEGER NOT NULL
);

CREATE INDEX idx_holidays_date ON holidays(date);

-- ============================================
-- SEED: Team Members
-- ============================================

INSERT INTO team_members (name, role, color) VALUES
  ('Marcel', 'admin', '#C5A572'),
  ('Thomas', 'manager', '#3B82F6'),
  ('Vanessa', 'manager', '#8B5CF6'),
  ('Antonella', 'member', '#EF4444');

-- ============================================
-- SEED: Swiss Holidays Kanton Bern 2026
-- ============================================

INSERT INTO holidays (name, date, is_national, year) VALUES
  ('Neujahr', '2026-01-01', true, 2026),
  ('Berchtoldstag', '2026-01-02', false, 2026),
  ('Karfreitag', '2026-04-03', true, 2026),
  ('Ostermontag', '2026-04-06', true, 2026),
  ('Tag der Arbeit', '2026-05-01', false, 2026),
  ('Auffahrt', '2026-05-14', true, 2026),
  ('Pfingstmontag', '2026-05-25', true, 2026),
  ('Bundesfeiertag', '2026-08-01', true, 2026),
  ('Weihnachten', '2026-12-25', true, 2026),
  ('Stephanstag', '2026-12-26', true, 2026);

-- ============================================
-- SEED: Initial Concepts
-- ============================================

INSERT INTO concepts (name, slug, description, target_audience, channels, menu_description, price_range) VALUES
  ('Afterwork', 'afterwork', 'Nach der Arbeit entspannen — kleiner Snack, Drinks, lockere Atmosphäre', 'Arbeitnehmer, Büro-Angestellte', ARRAY['flyer', 'instagram', 'facebook'], 'Kleiner Snack + Drink-Angebote', 'CHF 15-25'),
  ('Friday Lounge', 'friday-lounge', 'Freitag Abend Lounge-Konzept mit DJ und Spezialpreisen', 'Junge Erwachsene, Locals', ARRAY['instagram', 'tiktok', 'flyer'], 'Lounge-Menü + Cocktails', 'CHF 20-35'),
  ('Brunch', 'brunch', 'Sonntagsbrunch mit regionalen Produkten', 'Familien, Paare, Geniesser', ARRAY['instagram', 'facebook', 'mundpropaganda'], 'Brunch-Buffet mit lokalen Spezialitäten', 'CHF 35-49'),
  ('Biker Treff', 'biker-treff', 'Treffpunkt für Motorrad- und Velofahrer', 'Biker, Sportler', ARRAY['facebook', 'mundpropaganda'], 'Deftige Küche + Erfrischungen', 'CHF 18-30'),
  ('Sportler Menü', 'sportler-menu', 'Proteinreiche Menüs nach dem Training', 'Sportler, Fitness-Begeisterte', ARRAY['instagram', 'flyer'], 'Protein-Bowl, Fitness-Menüs', 'CHF 22-32'),
  ('Nachbarschafts-Apéro', 'nachbarschafts-apero', 'Lokale Gemeinschaft zusammenbringen', 'Anwohner, Nachbarschaft', ARRAY['flyer', 'mundpropaganda'], 'Apéro-Häppchen + Wein', 'CHF 0-20'),
  ('Themenabend', 'themenabend', 'Spezielle kulinarische Themenabende', 'Geniesser, Food-Enthusiasten', ARRAY['instagram', 'facebook', 'newsletter'], 'Wechselnde Themen-Menüs', 'CHF 45-65');
