/*
  # Fix storage policies for caricatures bucket

  1. Changes
    - Recreate caricatures bucket with proper settings
    - Update storage policies to properly handle user-specific uploads
    - Add proper MIME type validation
    - Ensure proper path validation for user folders
*/

-- Drop existing policies
drop policy if exists "caricatures_read_policy" on storage.objects;
drop policy if exists "caricatures_insert_policy" on storage.objects;

-- Recreate caricatures bucket with proper settings
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'caricatures',
    'caricatures',
    true,
    10485760, -- 10MB
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  )
  on conflict (id) do update set
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];
end $$;

-- Create read policy (public access for sharing)
create policy "caricatures_read_policy"
  on storage.objects for select
  using (bucket_id = 'caricatures');

-- Create insert policy with proper path validation
create policy "caricatures_insert_policy"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'caricatures'
    and (
      -- Allow uploads only to user's own folder
      substring(name from '^[^/]+') = auth.uid()::text
      -- Validate file extension
      and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
    )
  );

-- Create update policy for user's own files
create policy "caricatures_update_policy"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'caricatures'
    and substring(name from '^[^/]+') = auth.uid()::text
  )
  with check (
    bucket_id = 'caricatures'
    and substring(name from '^[^/]+') = auth.uid()::text
  );