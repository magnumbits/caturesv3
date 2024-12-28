/*
  # Fix user credits RLS policies and initialization

  1. Security
    - Update RLS policies for user_credits table
    - Add policy for inserting new user credits
  2. Triggers
    - Improve new user handler
*/

-- Drop existing policies
drop policy if exists "Users can manage their own credits" on user_credits;

-- Create separate policies for better control
create policy "Users can view their own credits"
  on user_credits
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own credits"
  on user_credits
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own credits"
  on user_credits
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Improve trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_credits (user_id, credits)
  values (new.id, 5)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Ensure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Initialize credits for existing users
insert into public.user_credits (user_id, credits)
select id, 5 from auth.users
on conflict (user_id) do nothing;