-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_items table (junction table)
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  creation_id UUID NOT NULL REFERENCES public.creations(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, creation_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view their own collections"
ON public.collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
ON public.collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON public.collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON public.collections FOR DELETE
USING (auth.uid() = user_id);

-- Collection items policies
CREATE POLICY "Users can view items in their collections"
ON public.collection_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE collections.id = collection_items.collection_id
    AND collections.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add items to their collections"
ON public.collection_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE collections.id = collection_items.collection_id
    AND collections.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove items from their collections"
ON public.collection_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE collections.id = collection_items.collection_id
    AND collections.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX idx_collection_items_creation_id ON public.collection_items(creation_id);

-- Trigger for updating collections updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();