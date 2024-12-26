/*
  # Fix storage bucket configuration

  1. Ensure Buckets Exist
    - Recreate styles bucket with correct settings
    - Update file size limit to 10MB
    - Set proper MIME types
  
  2. Security
    - Drop and recreate policies with correct permissions
    - Enable public read access
    - Allow authenticated uploads
*/

-- First ensure the styles bucket exists with correct settings
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
    'styles',
    'styles',
    true,
    10485760, -- 10MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Drop existing policies to avoid conflicts
do $$
begin
  drop policy if exists "Public Access to Styles" on storage.objects;
  drop policy if exists "Upload to Styles" on storage.objects;
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