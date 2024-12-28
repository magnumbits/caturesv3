-- Drop existing policies first to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;

-- Ensure the styles bucket exists with correct settings
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

-- Create bucket policies
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