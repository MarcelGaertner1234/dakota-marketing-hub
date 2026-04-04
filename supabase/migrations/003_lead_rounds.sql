-- Lead Rounds: Durchlauf-Tracking für wiederholte Kontaktaufnahmen
-- Jeder Lead kann mehrfach durch den Funnel laufen, jeder Durchlauf hat einen Grund

CREATE TABLE lead_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  started_by UUID REFERENCES team_members(id),
  outcome lead_status
);

CREATE INDEX idx_lead_rounds_lead ON lead_rounds(lead_id);

-- Aktivitäten einem Durchlauf zuordnen
ALTER TABLE lead_activities ADD COLUMN round_id UUID REFERENCES lead_rounds(id) ON DELETE SET NULL;

-- Bestehende Leads bekommen einen initialen Durchlauf (Round 1)
INSERT INTO lead_rounds (lead_id, round_number, reason, started_at)
SELECT id, 1, 'Erstkontakt', created_at FROM leads;

-- Bestehende Activities dem ersten Durchlauf zuordnen
UPDATE lead_activities SET round_id = (
  SELECT lr.id FROM lead_rounds lr WHERE lr.lead_id = lead_activities.lead_id ORDER BY lr.round_number LIMIT 1
);
