/*
  # Initial Schema Setup for Catures App

  1. New Tables
    - `caricatures`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `bestie_name` (text)
      - `original_image_url` (text)
      - `generated_image_url` (text)
      - `style_id` (text)
      - `share_url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `caricatures` table
    - Add policies for authenticated users to:
      - Create their own caricatures
      - Read their own caricatures
*/

CREATE TABLE IF NOT EXISTS caricatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  bestie_name text NOT NULL,
  original_image_url text NOT NULL,
  generated_image_url text,
  style_id text,
  share_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE caricatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own caricatures"
  ON caricatures
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own caricatures"
  ON caricatures
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);