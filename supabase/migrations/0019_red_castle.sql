/*
  # Add generations table

  1. New Tables
    - `generations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `bestie_name` (text)
      - `face_image_url` (text)
      - `generated_image_url` (text)
      - `style_id` (text)
      - `status` (enum)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their generations
*/

-- Create generation status enum
create type generation_status as enum (
  'face_uploaded',
  'generation_initiated',
  'generation_completed',
  'generation_failed',
  'generation_timeout'
);

-- Create generations table
create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  bestie_name text not null,
  face_image_url text not null,
  generated_image_url text,
  style_id text,
  status generation_status not null default 'face_uploaded',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table generations enable row level security;

-- Create policies
create policy "Users can insert their own generations"
  on generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own generations"
  on generations
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own generations"
  on generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_generations_updated_at
  before update on generations
  for each row
  execute function update_updated_at_column();