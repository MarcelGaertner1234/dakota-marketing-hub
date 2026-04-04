-- Lead-Qualität: Ansprechpartner, Story, Trigger-Punkte, Temperatur, Nächste Aktion

ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_role TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS trigger_points TEXT[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'kalt';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_date DATE;
