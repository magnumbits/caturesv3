/*
  # Add credits system
  
  1. New Tables
    - `user_credits`
      - `user_id` (uuid, references auth.users)
      - `credits` (integer, default 5)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Functions
    - Trigger to create initial credits for new users
    - Function to deduct credits
    
  3. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create user_credits table
create table user_credits (
  user_id uuid primary key references auth.users,
  credits integer not null default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint credits_non_negative check (credits >= 0)
);

-- Enable RLS
alter table user_credits enable row level security;

-- Create policies
create policy "Users can view their own credits"
  on user_credits
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own credits"
  on user_credits
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_credits (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();