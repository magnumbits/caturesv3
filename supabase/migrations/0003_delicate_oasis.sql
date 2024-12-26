/*
  # Update styles table schema

  1. Changes
    - Remove thumbnail_url column as we'll generate URLs dynamically
    - Update existing styles data
*/

-- Remove thumbnail_url column
ALTER TABLE styles DROP COLUMN IF EXISTS thumbnail_url;

-- Delete existing styles
DELETE FROM styles;

-- Insert styles without thumbnail URLs
INSERT INTO styles (id, name) VALUES
  ('style-2d', 'Style 2D'),
  ('style-cartoon', 'Style Cartoon')
ON CONFLICT (id) DO NOTHING;