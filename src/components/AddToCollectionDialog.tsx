import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
}

interface AddToCollectionDialogProps {
  creationId: string;
}

export const AddToCollectionDialog = ({ creationId }: AddToCollectionDialogProps) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadCollectionsAndStatus();
    }
  }, [isOpen, user, creationId]);

  const loadCollectionsAndStatus = async () => {
    try {
      // Load all collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name')
        .order('name');

      if (collectionsError) throw collectionsError;

      // Load which collections this creation is in
      const { data: itemsData, error: itemsError } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('creation_id', creationId);

      if (itemsError) throw itemsError;

      setCollections(collectionsData || []);
      setSelectedCollections(new Set(itemsData?.map(item => item.collection_id) || []));
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error("Failed to load collections");
    }
  };

  const handleToggle = async (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    
    setSelectedCollections(newSelected);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Get current items
      const { data: currentItems } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('creation_id', creationId);

      const currentCollectionIds = new Set(currentItems?.map(item => item.collection_id) || []);

      // Find items to add
      const toAdd = Array.from(selectedCollections).filter(id => !currentCollectionIds.has(id));
      
      // Find items to remove
      const toRemove = Array.from(currentCollectionIds).filter(id => !selectedCollections.has(id));

      // Add new items
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from('collection_items')
          .insert(toAdd.map(collectionId => ({
            collection_id: collectionId,
            creation_id: creationId
          })));

        if (addError) throw addError;
      }

      // Remove items
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('collection_items')
          .delete()
          .eq('creation_id', creationId)
          .in('collection_id', toRemove);

        if (removeError) throw removeError;
      }

      toast.success("Collections updated!");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error updating collections:', error);
      toast.error("Failed to update collections");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FolderPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collections</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No collections yet. Create one first!
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {collections.map((collection) => (
                <div key={collection.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={collection.id}
                    checked={selectedCollections.has(collection.id)}
                    onCheckedChange={() => handleToggle(collection.id)}
                  />
                  <label
                    htmlFor={collection.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {collection.name}
                  </label>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};