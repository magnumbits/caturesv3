/*
  # Update storage bucket file size limits

  1. Changes
    - Increase file size limit to 10MB for both styles and faces buckets
    - Preserve all other existing settings and policies
  
  2. Security
    - No changes to existing security policies
    - Only updating the file_size_limit parameter
*/

-- Update both buckets with new file size limit
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
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
    'faces',
    'faces',
    true,
    10485760, -- 10MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];