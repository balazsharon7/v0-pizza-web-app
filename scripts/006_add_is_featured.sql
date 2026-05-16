-- Add an is_featured flag so the admin can pick which products appear in the
-- "Népszerű pizzáink" section on the homepage. Idempotent.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_is_featured_idx
  ON products (is_featured)
  WHERE is_featured = true;

-- Force PostgREST to reload its schema cache so the REST API immediately
-- recognises the new column. Without this, the first update that sends
-- is_featured can come back with "Could not find the 'is_featured' column".
NOTIFY pgrst, 'reload schema';
