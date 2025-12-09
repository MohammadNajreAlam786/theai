-- Create a secure public_profiles view that only exposes non-sensitive data
-- This prevents email addresses from being exposed when viewing other users' profiles

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Drop the problematic RLS policy that exposes all columns
DROP POLICY IF EXISTS "Anyone can view profiles of users with public creations" ON public.profiles;

-- Create a security definer function to check if a user has public creations
CREATE OR REPLACE FUNCTION public.user_has_public_creations(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creations 
    WHERE creations.user_id = profile_id 
    AND creations.is_public = true
  );
$$;

-- Enable RLS on the view (views inherit from base table RLS, but we need explicit policy)
-- For the base profiles table, users can still only see their own profile's email
-- The public_profiles view is what should be used for public access