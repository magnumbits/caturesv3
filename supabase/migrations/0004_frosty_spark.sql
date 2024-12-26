/*
  # Add storage bucket for styles

  1. Storage Setup
    - Creates a public bucket named 'styles' for storing style images
    - Enables public access to the bucket
    
  2. Security
    - Allows authenticated users to upload files
    - Allows public read access to all files
*/

-- Create the styles bucket if it doesn't exist
begin;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'styles',
    'styles',
    true,
    5242880, -- 5MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
  on conflict (id) do nothing;

  -- Set up security policies for the bucket
  create policy "Public Access"
    on storage.objects for select
    using ( bucket_id = 'styles' );

  create policy "Authenticated users can upload images"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'styles' 
      and (lower(storage.extension(name)) = 'jpg' 
        or lower(storage.extension(name)) = 'jpeg' 
        or lower(storage.extension(name)) = 'png' 
        or lower(storage.extension(name)) = 'webp')
    );
commit;