/*
  # Fix user credits initialization

  1. Changes
    - Improve new user trigger to properly initialize credits
    - Add error handling for duplicate records
*/

-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create improved trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_credits (user_id, credits)
  values (new.id, 5)
  on conflict (user_id) do update
  set credits = EXCLUDED.credits
  where user_credits.credits < EXCLUDED.credits;
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Initialize credits for existing users
insert into public.user_credits (user_id, credits)
select id, 5 from auth.users
on conflict (user_id) do update
set credits = EXCLUDED.credits
where user_credits.credits < EXCLUDED.credits;