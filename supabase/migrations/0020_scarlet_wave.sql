/*
  # Fix caricatures bucket policies

  1. Changes
    - Recreate caricatures bucket with proper settings
    - Update RLS policies to ensure users can upload to their folders
    - Add proper MIME type validation
*/

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

-- Drop existing policies
drop policy if exists "caricatures_read_policy" on storage.objects;
drop policy if exists "caricatures_insert_policy" on storage.objects;

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
      -- Ensure file is in user's folder
      position(auth.uid()::text in name) = 1
      -- Validate file extension
      and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
    )
  );