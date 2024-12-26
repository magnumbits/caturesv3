-- Drop existing policies to avoid conflicts
do $$
begin
  drop policy if exists "Public Access to Styles" on storage.objects;
  drop policy if exists "Upload to Styles" on storage.objects;
  drop policy if exists "Public Access to Faces" on storage.objects;
  drop policy if exists "Upload to Faces" on storage.objects;
  drop policy if exists "Public Access to Caricatures" on storage.objects;
  drop policy if exists "Upload to Caricatures" on storage.objects;
end $$;

-- Create policies for styles bucket
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

-- Create policies for faces bucket
create policy "Public Access to Faces"
  on storage.objects for select
  using (bucket_id = 'faces');

create policy "Upload to Faces"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'faces'
    and storage.extension(name) = any(array['jpg', 'jpeg', 'png', 'webp'])
  );

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

-- Ensure all buckets exist with correct settings
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
    'styles',
    'styles',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'faces',
    'faces',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'caricatures',
    'caricatures',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];