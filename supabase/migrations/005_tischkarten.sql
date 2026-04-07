-- Tischkarten — personalisierte KI-generierte Reservierungs-Karten
-- im Dakota A5 Story-Stil. Eigenständiges Modul, keine FK zu anderen Tabellen.

CREATE TABLE IF NOT EXISTS tischkarten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Eingaben (vom Marcel im Form ausgefüllt)
  guest_name TEXT NOT NULL,
  occasion TEXT,                        -- 'birthday' | 'anniversary' | 'business' | 'family' | 'wedding' | 'none'
  party_size INTEGER,
  reservation_date DATE,
  table_number TEXT,
  custom_hint TEXT,

  -- KI-generierter Inhalt (im createTischkarte Server-Action befüllt)
  title TEXT NOT NULL,
  subtitle TEXT,
  paragraph_1 TEXT NOT NULL,
  paragraph_2 TEXT,
  paragraph_3 TEXT,

  -- Visuals (Default greift wenn illustration_url NULL ist)
  illustration_url TEXT,
  footer_signature TEXT NOT NULL DEFAULT 'Ihre Dakota Crew',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tischkarten_reservation_date
  ON tischkarten(reservation_date DESC);

CREATE INDEX IF NOT EXISTS idx_tischkarten_created_at
  ON tischkarten(created_at DESC);

COMMENT ON TABLE tischkarten IS
  'Personalisierte KI-generierte A5-Tischkarten für Reservierungen, im gleichen Stil wie Stories.';
