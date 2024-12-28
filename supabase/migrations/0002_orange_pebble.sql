/*
  # Add styles table

  1. New Tables
    - `styles`
      - `id` (text, primary key) - Style identifier
      - `name` (text) - Display name
      - `thumbnail_url` (text) - URL to style thumbnail
      - `created_at` (timestamptz) - Creation timestamp
      - `active` (boolean) - Whether style is active

  2. Security
    - Enable RLS on `styles` table
    - Add policy for authenticated users to read styles
*/

CREATE TABLE IF NOT EXISTS styles (
  id text PRIMARY KEY,
  name text NOT NULL,
  thumbnail_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active styles"
  ON styles
  FOR SELECT
  USING (active = true);

-- Insert initial styles
INSERT INTO styles (id, name, thumbnail_url) VALUES
  ('style-2d', 'Style 2D', 'https://sqmgymuhfrolwukgwpwy.supabase.co/storage/v1/object/public/styles/style-2d.png'),
  ('style-cartoon', 'Style Cartoon', 'https://sqmgymuhfrolwukgwpwy.supabase.co/storage/v1/object/public/styles/style-cartoon.png')
ON CONFLICT (id) DO NOTHING;