/*
  # Fix RLS policies for caricatures table

  1. Changes
    - Drop existing RLS policies
    - Add new policies with proper user authentication checks
    - Enable RLS on caricatures table
    
  2. Security
    - Users can only insert their own caricatures
    - Users can read their own caricatures
    - Public access is disabled
*/

-- Drop existing policies if they exist
drop policy if exists "Users can create their own caricatures" on caricatures;
drop policy if exists "Users can read their own caricatures" on caricatures;

-- Enable RLS
alter table caricatures enable row level security;

-- Create new policies
create policy "caricatures_insert_policy"
  on caricatures
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "caricatures_select_policy"
  on caricatures
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Add generated_at timestamp
alter table caricatures 
add column if not exists generated_at timestamptz default now();

-- Add status column
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'caricature_status') then
    create type caricature_status as enum ('pending', 'completed', 'failed');
  end if;
exception
  when duplicate_object then null;
end $$;

alter table caricatures
add column if not exists status caricature_status default 'pending';