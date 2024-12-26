/*
  # Create storage buckets with public access

  1. Changes
    - Create both styles and faces buckets
    - Enable public access
    - Set file size limits and allowed MIME types
    - Create public access policies
    - Create upload policies for authenticated users
  
  2. Security
    - Both buckets are public for reading
    - Only authenticated users can upload
    - File type restrictions enforced
*/

-- First ensure both buckets exist with correct settings
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
    'styles',
    'styles',
    true,
    5242880, -- 5MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
    'faces',
    'faces',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Drop any existing policies to avoid conflicts
do $$
begin
  drop policy if exists "Public Access to Styles" on storage.objects;
  drop policy if exists "Upload to Styles" on storage.objects;
  drop policy if exists "Public Access to Faces" on storage.objects;
  drop policy if exists "Upload to Faces" on storage.objects;
end $$;

-- Create new policies with exact bucket name matching
create policy "Public Access to Styles"
  on storage.objects for select
  using (bucket_id = 'styles');

create policy "Upload to Styles"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'styles'
    and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
  );

create policy "Public Access to Faces"
  on storage.objects for select
  using (bucket_id = 'faces');

create policy "Upload to Faces"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'faces'
    and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
  );