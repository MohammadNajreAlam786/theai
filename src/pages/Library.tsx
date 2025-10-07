import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Trash2, Eye, Share2, Globe, Search, Grid3x3, List, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LikeButton } from "@/components/LikeButton";
import { CommentsSection } from "@/components/CommentsSection";
import { CollectionManager } from "@/components/CollectionManager";
import { AddToCollectionDialog } from "@/components/AddToCollectionDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Creation {
  id: string;
  title: string;
  type: string;
  content: string;
  prompt: string;
  metadata: any;
  is_public: boolean;
  created_at: string;
}

const Library = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [publicCreations, setPublicCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchCreations();
      fetchPublicCreations();
    }
  }, [user, authLoading, navigate, selectedCollectionId]);

  const fetchCreations = async () => {
    try {
      let query = supabase.from('creations').select('*');

      // Filter by collection if one is selected
      if (selectedCollectionId) {
        const { data: collectionItems } = await supabase
          .from('collection_items')
          .select('creation_id')
          .eq('collection_id', selectedCollectionId);

        const creationIds = collectionItems?.map(item => item.creation_id) || [];
        
        if (creationIds.length === 0) {
          setCreations([]);
          setLoading(false);
          return;
        }

        query = query.in('id', creationIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCreations(data || []);
    } catch (error) {
      console.error('Error fetching creations:', error);
      toast({
        title: "Error",
        description: "Failed to load your creations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicCreations = async () => {
    try {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublicCreations(data || []);
    } catch (error) {
      console.error('Error fetching public creations:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('creations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCreations(creations.filter(c => c.id !== id));
      toast({
        title: "Deleted",
        description: "Creation removed from library"
      });
    } catch (error) {
      console.error('Error deleting creation:', error);
      toast({
        title: "Error",
        description: "Failed to delete creation",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublic = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('creations')
        .update({ is_public: !currentState })
        .eq('id', id);

      if (error) throw error;

      setCreations(creations.map(c => 
        c.id === id ? { ...c, is_public: !currentState } : c
      ));

      toast({
        title: !currentState ? "Made Public" : "Made Private",
        description: !currentState ? "Your creation is now visible to everyone" : "Your creation is now private"
      });
    } catch (error) {
      console.error('Error toggling public status:', error);
      toast({
        title: "Error",
        description: "Failed to update sharing settings",
        variant: "destructive"
      });
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      text: 'bg-gradient-primary',
      image: 'bg-gradient-secondary',
      music: 'bg-gradient-accent',
      video: 'bg-gradient-orange'
    };
    return colors[type as keyof typeof colors] || 'bg-gradient-primary';
  };

  const filteredCreations = useMemo(() => {
    const sourceCreations = activeTab === 'my' ? creations : publicCreations;
    
    return sourceCreations.filter(c => {
      const matchesSearch = !searchQuery || 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [activeTab, creations, publicCreations, searchQuery, typeFilter]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />

      <header className="relative z-50 border-b border-border bg-card/40 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">My Library</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Card className="p-4 bg-card/50 backdrop-blur-xl sticky top-24">
              <CollectionManager
                selectedCollectionId={selectedCollectionId}
                onCollectionSelect={setSelectedCollectionId}
              />
            </Card>
          </aside>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'discover')}>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="my">My Creations</TabsTrigger>
                <TabsTrigger value="discover">Discover</TabsTrigger>
              </TabsList>

              <div className="mb-6 space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title or prompt..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1 border border-border rounded-md p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

          <TabsContent value="my">
            {filteredCreations.length === 0 ? (
              <Card className="max-w-2xl mx-auto p-12 text-center bg-card/50 backdrop-blur-xl">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
                <h2 className="text-2xl font-bold mb-2">{creations.length === 0 ? "Your library is empty" : "No results found"}</h2>
                <p className="text-muted-foreground mb-6">{creations.length === 0 ? "Start creating to see your work here" : "Try adjusting your search or filters"}</p>
                {creations.length === 0 && <Button variant="hero" onClick={() => navigate('/dashboard')}>Start Creating</Button>}
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredCreations.map((creation, i) => (
                  <Card key={creation.id} className={`p-6 bg-card/50 backdrop-blur-xl animate-fade-in ${viewMode === 'list' ? 'flex gap-6 items-start' : ''}`} style={{animationDelay: `${i*0.05}s`}}>
                    {viewMode === 'list' && creation.type === 'image' && (
                      <img src={creation.content} className="w-32 h-32 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-4">
                        <div className="flex gap-2 items-center">
                          <span className={`px-3 py-1 rounded-full text-xs ${getTypeColor(creation.type)} bg-clip-text text-transparent`}>{creation.type}</span>
                          {creation.is_public && <Globe className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCreation(creation)}><Eye className="w-4 h-4" /></Button>
                          <AddToCollectionDialog creationId={creation.id} />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePublic(creation.id, creation.is_public)}><Share2 className="w-4 h-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(creation.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <h3 className="font-bold mb-2">{creation.title}</h3>
                      {viewMode === 'grid' && creation.type === 'image' ? (
                        <img src={creation.content} className="w-full h-48 object-cover rounded mb-4" />
                      ) : viewMode === 'grid' ? (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{creation.content}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{creation.prompt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{new Date(creation.created_at).toLocaleDateString()}</div>
                        <div className="flex gap-2">
                          <LikeButton creationId={creation.id} />
                          <CommentsSection creationId={creation.id} />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredCreations.map((creation, i) => (
                <Card key={creation.id} className={`p-6 bg-card/50 backdrop-blur-xl animate-fade-in cursor-pointer ${viewMode === 'list' ? 'flex gap-6 items-start' : ''}`} style={{animationDelay: `${i*0.05}s`}} onClick={() => setSelectedCreation(creation)}>
                  {viewMode === 'list' && creation.type === 'image' && (
                    <img src={creation.content} className="w-32 h-32 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`px-3 py-1 rounded-full text-xs ${getTypeColor(creation.type)} bg-clip-text text-transparent mb-4 inline-block`}>{creation.type}</span>
                    <h3 className="font-bold mb-2">{creation.title}</h3>
                    {viewMode === 'grid' && creation.type === 'image' ? (
                      <img src={creation.content} className="w-full h-48 object-cover rounded mb-4" />
                    ) : viewMode === 'grid' ? (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{creation.content}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{creation.prompt}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <LikeButton creationId={creation.id} />
                      <CommentsSection creationId={creation.id} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
            </Tabs>
          </div>
        </div>

        {selectedCreation && (
          <AlertDialog open={!!selectedCreation} onOpenChange={() => setSelectedCreation(null)}>
            <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>{selectedCreation.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="mt-4 space-y-4">
                    <div><strong>Prompt:</strong><p className="mt-1 text-foreground/80">{selectedCreation.prompt}</p></div>
                    {selectedCreation.type === 'image' ? <img src={selectedCreation.content} className="w-full rounded-lg" /> : <p className="text-foreground/80 whitespace-pre-wrap">{selectedCreation.content}</p>}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Close</AlertDialogCancel></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </div>
  );
};

export default Library;
