/*
  # Update share policies for public access
  
  1. Changes
    - Update RLS policies to allow public access to shared generations
    - Add policies for public access to share links and related generations
*/

-- Update generations table policies
drop policy if exists "Users can view their own generations" on generations;
create policy "Users can view their own or shared generations"
  on generations
  for select
  using (
    auth.uid() = user_id
    or id in (
      select generation_id 
      from share_links 
      where share_token is not null
    )
  );

-- Update share_links policies to explicitly allow public access
drop policy if exists "Anyone can read share links" on share_links;
create policy "Public access to share links"
  on share_links
  for select
  using (true);