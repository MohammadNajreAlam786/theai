-- Fix the SECURITY DEFINER view warning by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Re-grant SELECT on the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;