import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, Plus, Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  item_count?: number;
}

interface CollectionManagerProps {
  onCollectionSelect?: (collectionId: string | null) => void;
  selectedCollectionId?: string | null;
}

export const CollectionManager = ({ onCollectionSelect, selectedCollectionId }: CollectionManagerProps) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  const loadCollections = async () => {
    try {
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get item counts for each collection
      if (collectionsData) {
        const collectionsWithCounts = await Promise.all(
          collectionsData.map(async (collection) => {
            const { count } = await supabase
              .from('collection_items')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);
            
            return { ...collection, item_count: count || 0 };
          })
        );
        setCollections(collectionsWithCounts);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error("Failed to load collections");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null
        });

      if (error) throw error;

      toast.success("Collection created!");
      setName("");
      setDescription("");
      setIsCreateOpen(false);
      loadCollections();
    } catch (error: any) {
      console.error('Error creating collection:', error);
      toast.error("Failed to create collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('collections')
        .update({
          name: name.trim(),
          description: description.trim() || null
        })
        .eq('id', editingCollection.id);

      if (error) throw error;

      toast.success("Collection updated!");
      setName("");
      setDescription("");
      setIsEditOpen(false);
      setEditingCollection(null);
      loadCollections();
    } catch (error: any) {
      console.error('Error updating collection:', error);
      toast.error("Failed to update collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      toast.success("Collection deleted");
      if (selectedCollectionId === collectionId) {
        onCollectionSelect?.(null);
      }
      loadCollections();
    } catch (error: any) {
      console.error('Error deleting collection:', error);
      toast.error("Failed to delete collection");
    }
  };

  const openEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setName(collection.name);
    setDescription(collection.description || "");
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Collections
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  placeholder="My Collection"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                <Textarea
                  placeholder="Describe your collection..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <Button
          variant={selectedCollectionId === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onCollectionSelect?.(null)}
        >
          <Folder className="h-4 w-4 mr-2" />
          All Creations
        </Button>

        {collections.map((collection) => (
          <div
            key={collection.id}
            className={`flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 ${
              selectedCollectionId === collection.id ? 'bg-accent' : ''
            }`}
          >
            <Button
              variant="ghost"
              className="flex-1 justify-start"
              onClick={() => onCollectionSelect?.(collection.id)}
            >
              <Folder className="h-4 w-4 mr-2" />
              <span className="flex-1 text-left">{collection.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {collection.item_count || 0}
              </span>
            </Button>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEdit(collection)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the collection but won't delete the creations inside it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(collection.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="My Collection"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optional)</label>
              <Textarea
                placeholder="Describe your collection..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};