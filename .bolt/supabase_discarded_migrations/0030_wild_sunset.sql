/*
  # Add shared caricatures table and policies

  1. New Tables
    - `shared_caricatures` table for tracking shared caricatures
      - `id` (uuid, primary key)
      - `generation_id` (uuid, references generations)
      - `share_token` (text, unique)
      - `accessed_count` (integer)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public access to shared caricatures
*/

-- Create shared_caricatures table
create table if not exists shared_caricatures (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid references generations not null,
  share_token text unique not null,
  accessed_count integer default 0,
  created_at timestamptz default now(),
  expires_at timestamptz,
  constraint share_token_length check (char_length(share_token) >= 10)
);

-- Enable RLS
alter table shared_caricatures enable row level security;

-- Create policies
create policy "Anyone can read shared caricatures"
  on shared_caricatures
  for select
  using (true);

create policy "Authenticated users can create shared caricatures"
  on shared_caricatures
  for insert
  to authenticated
  with check (
    exists (
      select 1 from generations
      where generations.id = generation_id
      and generations.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
create index shared_caricatures_token_idx on shared_caricatures(share_token);

-- Add function to increment access count
create or replace function increment_share_access()
returns trigger as $$
begin
  update shared_caricatures
  set accessed_count = accessed_count + 1
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to increment access count on select
create trigger increment_share_access_count
  after select on shared_caricatures
  for each row
  execute function increment_share_access();