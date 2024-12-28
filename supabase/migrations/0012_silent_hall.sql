/*
  # Add caricature storage and handling

  1. New Bucket
    - Create 'caricatures' bucket for storing generated images
    - 10MB file size limit
    - Public access for viewing
    - Authenticated upload access
  
  2. Security
    - Enable RLS
    - Public read access
    - Authenticated users can upload their generated caricatures
*/

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

-- Create policies for caricatures bucket
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