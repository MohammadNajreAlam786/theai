-- Add a SELECT policy that allows viewing profiles of users who have public creations
-- This enables displaying author information on public creations while protecting email addresses

CREATE POLICY "Anyone can view profiles of users with public creations" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.creations 
    WHERE creations.user_id = profiles.id 
    AND creations.is_public = true
  )
);