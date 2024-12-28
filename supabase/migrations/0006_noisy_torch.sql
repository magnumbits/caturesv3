/*
  # Add faces bucket for storing user face images

  1. New Storage
    - Creates faces bucket for storing user uploaded face images
    - Sets 5MB file size limit
    - Allows common image formats
  
  2. Security
    - Public read access for face images
    - Authenticated users can upload images
*/

do $$
begin
  -- Create the bucket if it doesn't exist
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'faces',
    'faces',
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
  drop policy if exists "Authenticated users can upload faces" on storage.objects;

  -- Create new policies
  create policy "Public Access"
    on storage.objects for select
    using ( bucket_id = 'faces' );

  create policy "Authenticated users can upload faces"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'faces' 
      and (lower(storage.extension(name)) = 'jpg' 
        or lower(storage.extension(name)) = 'jpeg' 
        or lower(storage.extension(name)) = 'png' 
        or lower(storage.extension(name)) = 'webp')
    );
end $$;