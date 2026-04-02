-- Fix: series_id was UUID but UI uses text slugs (e.g. "afterwork-launch")
-- Change to TEXT to allow human-readable series identifiers
ALTER TABLE social_posts ALTER COLUMN series_id TYPE TEXT;
