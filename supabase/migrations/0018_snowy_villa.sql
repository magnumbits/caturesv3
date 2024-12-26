/*
  # Recreate Caricatures Bucket with User Folders

  1. Changes
    - Create caricatures bucket with proper settings
    - Add policies for user-specific folder access
    - Ensure proper file type restrictions
    
  2. Security
    - Users can only upload to their own folders
    - Public read access for sharing
    - Strict file type validation
*/

-- Create caricatures bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'caricatures',
  'caricatures',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Drop existing policies if they exist
drop policy if exists "caricatures_read_policy" on storage.objects;
drop policy if exists "caricatures_insert_policy" on storage.objects;

-- Create read policy (public access for sharing)
create policy "caricatures_read_policy"
  on storage.objects for select
  using (bucket_id = 'caricatures');

-- Create insert policy (users can only upload to their own folders)
create policy "caricatures_insert_policy"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'caricatures'
    and (
      -- Ensure path starts with user ID
      position(auth.uid()::text in name) = 1
      -- Validate file extension
      and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
    )
  );