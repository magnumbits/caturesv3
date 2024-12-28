/*
  # Fix case sensitivity in storage policies

  1. Changes
    - Drop existing policies
    - Create new policies with case-insensitive bucket ID comparison
    - Add both uppercase and lowercase file extensions
  
  2. Security
    - Maintains existing security model
    - Ensures consistent access regardless of case
*/

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access to Styles" on storage.objects;
drop policy if exists "Upload to Styles" on storage.objects;
drop policy if exists "Public Access to Faces" on storage.objects;
drop policy if exists "Upload to Faces" on storage.objects;

-- Create case-insensitive policies for styles bucket
create policy "Public Access to Styles"
  on storage.objects for select
  using (lower(bucket_id) = 'styles');

create policy "Upload to Styles"
  on storage.objects for insert
  to authenticated
  with check (
    lower(bucket_id) = 'styles'
    and (
      lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    )
  );

-- Create case-insensitive policies for faces bucket
create policy "Public Access to Faces"
  on storage.objects for select
  using (lower(bucket_id) = 'faces');

create policy "Upload to Faces"
  on storage.objects for insert
  to authenticated
  with check (
    lower(bucket_id) = 'faces'
    and (
      lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    )
  );