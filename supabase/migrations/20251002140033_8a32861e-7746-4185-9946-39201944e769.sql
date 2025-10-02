-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creation_id UUID NOT NULL REFERENCES public.creations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creation_id UUID NOT NULL REFERENCES public.creations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments on public creations"
ON public.comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creations
    WHERE creations.id = comments.creation_id
    AND creations.is_public = true
  )
);

CREATE POLICY "Users can view comments on their own creations"
ON public.comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creations
    WHERE creations.id = comments.creation_id
    AND creations.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes on public creations"
ON public.likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creations
    WHERE creations.id = likes.creation_id
    AND creations.is_public = true
  )
);

CREATE POLICY "Users can view likes on their own creations"
ON public.likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creations
    WHERE creations.id = likes.creation_id
    AND creations.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create likes"
ON public.likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.likes FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_comments_creation_id ON public.comments(creation_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_likes_creation_id ON public.likes(creation_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);

-- Trigger for updating comments updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments and likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;