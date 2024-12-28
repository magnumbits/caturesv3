/*
  # Add caricatures storage bucket

  1. New Storage Bucket
    - Creates caricatures bucket for storing generated images
    - 10MB file size limit
    - Public access for viewing
    - Authenticated users can upload

  2. Security Policies
    - Public read access
    - Authenticated users can upload images
    - File type restrictions (jpg, jpeg, png, webp)
*/

-- Drop existing policies if they exist
do $$
begin
  drop policy if exists "Public Access to Caricatures" on storage.objects;
  drop policy if exists "Upload to Caricatures" on storage.objects;
end $$;

-- Create caricatures bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
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

-- Create new policies
create policy "Public Access to Caricatures"
  on storage.objects for select
  using (bucket_id = 'caricatures');

create policy "Upload to Caricatures"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'caricatures'
    and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
  );