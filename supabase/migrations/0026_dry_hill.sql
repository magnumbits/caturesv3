/*
  # Add sender details to share links

  1. Changes
    - Add sender_name and message columns to share_links table
    - Update RLS policies to allow these new fields
*/

-- Add new columns to share_links table
alter table share_links
add column if not exists sender_name text,
add column if not exists message text;

-- Update existing policies to include new columns
drop policy if exists "Users can create share links for their generations" on share_links;
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

-- Allow reading of new columns
drop policy if exists "Anyone can read share links" on share_links;
create policy "Anyone can read share links"
  on share_links
  for select
  using (true);