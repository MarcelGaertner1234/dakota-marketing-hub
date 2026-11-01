-- 008 · AIRL Monats-Cockpit (Winter 2026/27 + Ziel 2027)
-- Additiv, kein Auth/RLS (internes Team-Tool, wie 001).

CREATE TABLE IF NOT EXISTS cockpit_settings (
  key TEXT PRIMARY KEY,
  value NUMERIC NOT NULL,
  label TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ein Datensatz pro Monat (erster Tag des Monats).
-- betriebstage/verdichtung/Forecast-Eingaben gelten fuer den Planmonat,
-- ist_* sind die offiziellen Monatswerte (Rapport/Protel), vor allem fuer 2026 als Referenz.
CREATE TABLE IF NOT EXISTS cockpit_months (
  monat DATE PRIMARY KEY,
  betriebstage INTEGER NOT NULL DEFAULT 0,
  offene_tage INTEGER,
  verdichtung NUMERIC NOT NULL DEFAULT 1.0,
  hp_einzel_pers INTEGER NOT NULL DEFAULT 0,
  hp_gruppe_pers INTEGER NOT NULL DEFAULT 0,
  logiernaechte INTEGER NOT NULL DEFAULT 0,
  gaeste_woche INTEGER NOT NULL DEFAULT 230,
  bon NUMERIC NOT NULL DEFAULT 34,
  kapitel_menues INTEGER NOT NULL DEFAULT 0,
  ist_restaurant NUMERIC,
  ist_food NUMERIC,
  ist_beverage NUMERIC,
  ist_fruehstueck NUMERIC,
  ist_hp NUMERIC,
  ist_personen INTEGER,
  geschaetzt BOOLEAN NOT NULL DEFAULT FALSE,
  quelle TEXT,
  notiz TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eine Zeile pro Wochenrapport (Ist). Monat = Monat des Sonntags (bis).
CREATE TABLE IF NOT EXISTS cockpit_wochen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kw INTEGER NOT NULL,
  von DATE NOT NULL,
  bis DATE NOT NULL UNIQUE,
  restaurant_netto NUMERIC NOT NULL DEFAULT 0,
  food NUMERIC,
  beverage NUMERIC,
  trinkgeld NUMERIC,
  fruehstueck NUMERIC NOT NULL DEFAULT 0,
  halbpension NUMERIC NOT NULL DEFAULT 0,
  personen INTEGER NOT NULL DEFAULT 0,
  kapitel_menues INTEGER NOT NULL DEFAULT 0,
  anlaesse_anzahl INTEGER NOT NULL DEFAULT 0,
  anlass_umsatz NUMERIC NOT NULL DEFAULT 0,
  ausfalltage INTEGER NOT NULL DEFAULT 0,
  bemerkung TEXT,
  erfasst_von TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cockpit_wochen_bis_idx ON cockpit_wochen (bis);

-- Gebuchte Anlaesse (Forecast). Nur Status 'fix' zaehlt als sicher.
CREATE TABLE IF NOT EXISTS cockpit_anlaesse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datum DATE NOT NULL,
  anlass TEXT NOT NULL,
  personen INTEGER NOT NULL DEFAULT 0,
  preis NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'option' CHECK (status IN ('fix', 'option')),
  bemerkung TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cockpit_anlaesse_datum_idx ON cockpit_anlaesse (datum);

-- Kennzahlen und Schwellen (Gespraech 1.11.2026, Protel-Export 01.01.-01.11.2026)
INSERT INTO cockpit_settings (key, value, label) VALUES
  ('be_restaurant', 26400, 'Break-even Restaurant à la carte, 17 Betriebstage'),
  ('pl_restaurant', 33900, 'Profit/Loss Restaurant à la carte, 17 Betriebstage'),
  ('be_anlaesse', 8700, 'Anlässe ab 10 Personen, 17 Betriebstage'),
  ('be_fruehstueck', 12000, 'Frühstück Break-even pro Monat'),
  ('pl_fruehstueck', 12000, 'Frühstück Basis pro Monat'),
  ('lohnkosten', 30000, 'Lohnkosten pro Monat'),
  ('fruehstueck_pp', 19.70, 'Frühstück pro Person (Protel 2026: 216 674 / 11 011)'),
  ('hp_einzel_pp', 36.80, 'Halbpension Einzel pro Person (Protel 2026)'),
  ('hp_gruppe_pp', 23.10, 'Halbpension Gruppe pro Person (Protel 2026)'),
  ('gaeste_boden', 210, 'Gäste pro Woche Boden'),
  ('gaeste_basis', 230, 'Gäste pro Woche Basis'),
  ('bon_boden', 29, 'Bon pro Gast Boden'),
  ('bon_basis', 34, 'Bon pro Gast Basis'),
  ('kapitel_boden', 0.30, 'Kapitel-Anteil Boden'),
  ('kapitel_basis', 0.35, 'Kapitel-Anteil Basis'),
  ('uplift', 1.00, 'Konzept-Uplift Ziel 2027 (1.00 = Niveau 2026)')
ON CONFLICT (key) DO NOTHING;
