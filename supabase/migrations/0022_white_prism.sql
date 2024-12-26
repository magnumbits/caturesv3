/*
  # Add sharing links table
  
  1. New Tables
    - `share_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `generation_id` (uuid, references generations)
      - `share_token` (text, unique)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `accessed_count` (integer)

  2. Security
    - Enable RLS on `share_links` table
    - Add policy for authenticated users to create share links
    - Add policy for anyone to read share links
*/

create table share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  generation_id uuid references generations not null,
  share_token text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz,
  accessed_count integer default 0,
  constraint share_token_length check (char_length(share_token) >= 10)
);

alter table share_links enable row level security;

-- Allow authenticated users to create share links for their generations
create policy "Users can create share links for their generations"
  on share_links
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from generations
      where generations.id = generation_id
      and generations.user_id = auth.uid()
    )
  );

-- Allow anyone to read share links
create policy "Anyone can read share links"
  on share_links
  for select
  using (true);

-- Create index for faster lookups
create index share_links_token_idx on share_links(share_token);