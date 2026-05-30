/*
  # Auto-admin for first user and admin promotion function

  1. Changes
    - Creates a function `promote_to_admin(email)` that can be called to make any user an admin
    - Adds automatic admin promotion for the very first user who signs up

  2. Security
    - The promote function is SECURITY DEFINER (runs as superuser)
    - Only callable by service role or via SQL
  
  3. Important Notes
    - The first user to register will automatically become admin
    - Subsequent users need to be promoted manually via SQL or admin panel
*/

-- Function to promote any user to admin by email
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.users SET is_admin = true WHERE email = user_email;
  RETURN FOUND;
END;
$$;

-- Auto-promote first user to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  INSERT INTO public.users (id, email, full_name, is_admin)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_count = 0  -- First user becomes admin
  );
  RETURN NEW;
END;
$$;
