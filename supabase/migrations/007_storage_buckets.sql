-- Ensure all Storage-Buckets the app uses exist.
-- story-illustrations was already created in 002_stories.sql.
-- These here are used by the upload + generate-* routes but were never migrated.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('social-images', 'social-images', true),
  ('event-images', 'event-images', true),
  ('concept-images', 'concept-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public READ for everyone (internal tool, no auth layer).
-- WRITE is done via service-role key from the server — anon cannot write.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'dakota_public_read'
  ) THEN
    CREATE POLICY dakota_public_read ON storage.objects
      FOR SELECT
      USING (bucket_id IN ('story-illustrations', 'social-images', 'event-images', 'concept-images'));
  END IF;
END $$;
