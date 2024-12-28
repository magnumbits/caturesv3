-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Authenticated users can upload faces" on storage.objects;

-- Create separate policies for styles bucket
create policy "Public Access to Styles"
  on storage.objects for select
  using (bucket_id = 'styles');

create policy "Upload to Styles"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'styles' 
    and (lower(storage.extension(name)) = 'jpg' 
      or lower(storage.extension(name)) = 'jpeg' 
      or lower(storage.extension(name)) = 'png' 
      or lower(storage.extension(name)) = 'webp')
  );

-- Create separate policies for faces bucket
create policy "Public Access to Faces"
  on storage.objects for select
  using (bucket_id = 'faces');

create policy "Upload to Faces"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'faces'
    and (lower(storage.extension(name)) = 'jpg' 
      or lower(storage.extension(name)) = 'jpeg' 
      or lower(storage.extension(name)) = 'png' 
      or lower(storage.extension(name)) = 'webp')
  );