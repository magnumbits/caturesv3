/*
  # Set up styles storage bucket

  1. Changes
    - Create styles bucket for storing style images
    - Configure bucket settings (public access, size limits, MIME types)
    - Set up RLS policies for bucket access
  
  2. Security
    - Enable public read access for style images
    - Restrict uploads to authenticated users only
    - Enforce file type and size restrictions
*/

do $$
begin
  -- Create the bucket if it doesn't exist
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
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

  -- Drop existing policies if they exist
  drop policy if exists "Public Access" on storage.objects;
  drop policy if exists "Authenticated users can upload images" on storage.objects;

  -- Create new policies
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
end $$;