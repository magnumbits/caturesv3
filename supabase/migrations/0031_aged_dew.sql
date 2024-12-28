/*
  # Add phone number to user credits

  1. Changes
    - Add phone_number column to user_credits table
    - Update handle_new_user trigger to include phone number
*/

-- Add phone_number column to user_credits
alter table user_credits
add column phone_number text;

-- Update trigger function to include phone number
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_credits (user_id, credits, phone_number)
  values (new.id, 5, new.phone::text)
  on conflict (user_id) do update
  set 
    credits = EXCLUDED.credits,
    phone_number = EXCLUDED.phone_number
  where user_credits.credits < EXCLUDED.credits;
  return new;
end;
$$ language plpgsql security definer;

-- Update existing users' phone numbers
update user_credits
set phone_number = auth.users.phone
from auth.users
where user_credits.user_id = auth.users.id
and user_credits.phone_number is null;