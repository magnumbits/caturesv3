/*
  # Fix storage policies and bucket configuration

  1. Changes
    - Drop all existing storage policies to avoid conflicts
    - Recreate buckets with correct settings
    - Add new storage policies with proper access rules
    - Fix policy naming conflicts
    
  2. Security
    - Enable public read access for styles bucket
    - Restrict write access to authenticated users
    - Validate file types and sizes
*/

-- Drop all existing storage policies to avoid conflicts
do $$
begin
  drop policy if exists "Public Access to Styles" on storage.objects;
  drop policy if exists "Upload to Styles" on storage.objects;
  drop policy if exists "Public Access to Faces" on storage.objects;
  drop policy if exists "Upload to Faces" on storage.objects;
  drop policy if exists "Public Access to Caricatures" on storage.objects;
  drop policy if exists "Upload to Caricatures" on storage.objects;
end $$;

-- Recreate buckets with correct settings
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
    'styles',
    'styles',
    true,
    10485760, -- 10MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'faces',
    'faces',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'caricatures',
    'caricatures',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Create new storage policies with unique names
create policy "styles_read_policy"
  on storage.objects for select
  using (bucket_id = 'styles');

create policy "styles_insert_policy"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'styles'
    and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
  );

create policy "faces_read_policy"
  on storage.objects for select
  using (bucket_id = 'faces');

create policy "faces_insert_policy"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'faces'
    and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
  );

create policy "caricatures_read_policy"
  on storage.objects for select
  using (bucket_id = 'caricatures');

create policy "caricatures_insert_policy"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'caricatures'
    and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
  );