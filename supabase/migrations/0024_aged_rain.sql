/*
  # Fix user credits policies

  1. Changes
    - Add policy for users to insert their own credit records
    - Add policy for users to update their own credit records
    - Add policy for users to read their own credit records
*/

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own credits" on user_credits;
drop policy if exists "Users can update their own credits" on user_credits;

-- Create comprehensive policies
create policy "Users can manage their own credits"
  on user_credits
  for all -- covers select, insert, update, delete
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create trigger to update timestamp
create or replace function update_user_credits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_credits_timestamp
  before update on user_credits
  for each row
  execute function update_user_credits_updated_at();