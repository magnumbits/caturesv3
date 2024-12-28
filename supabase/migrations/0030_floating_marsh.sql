/*
  # Add public access policy for shared generations

  1. Changes
    - Add policy to allow public access to generations that have been shared
    - Update existing policy to include shared generations

  2. Security
    - Only allows access to generations that have an active share link
    - Maintains existing authenticated user access
*/

-- Drop existing select policy
drop policy if exists "Users can view their own generations" on generations;

-- Create comprehensive select policy
create policy "Users can view own or shared generations"
  on generations
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 
      from share_links 
      where share_links.generation_id = id
      and share_links.expires_at > now()
    )
  );

-- Update share_links policies to ensure public access
drop policy if exists "Public access to share links" on share_links;
create policy "Anyone can access valid share links"
  on share_links
  for select
  using (
    expires_at > now()
  );