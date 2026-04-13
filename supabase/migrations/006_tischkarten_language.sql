-- Add language support to tischkarten (de/en/fr/it)
ALTER TABLE tischkarten
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'de';

-- Backfill: all existing cards are German
UPDATE tischkarten SET language = 'de' WHERE language IS NULL;
