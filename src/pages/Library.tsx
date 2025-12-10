import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Trash2, Eye, Share2, Globe, Search, Grid3x3, List, Filter, X, Image as ImageIcon, FileText } from "lucide-react";
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
      image: 'bg-gradient-secondary'
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
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "space-y-6"}>
                {filteredCreations.map((creation, i) => (
                  <Card key={creation.id} className={`group overflow-hidden bg-card/50 backdrop-blur-xl border-border hover:border-primary/50 transition-all duration-300 animate-fade-in ${viewMode === 'list' ? 'flex gap-6' : ''}`} style={{animationDelay: `${i*0.05}s`}}>
                    {/* Content Preview Section */}
                    <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'}`}>
                      {creation.type === 'image' ? (
                        <div className="relative h-56 bg-muted/30 overflow-hidden">
                          <img src={creation.content} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={creation.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                          <ImageIcon className="absolute top-3 left-3 w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <div className="relative h-56 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-primary/10 flex items-center justify-center p-6">
                          <FileText className="w-16 h-16 text-primary/40 absolute" />
                          <p className="relative z-10 text-sm text-foreground/60 line-clamp-6 text-center">{creation.content}</p>
                          <FileText className="absolute top-3 left-3 w-5 h-5 text-primary" />
                        </div>
                      )}
                      {creation.is_public && (
                        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm rounded-full p-1.5">
                          <Globe className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">{creation.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(creation.type)} bg-clip-text text-transparent`}>
                              {creation.type.toUpperCase()}
                            </span>
                            <span>•</span>
                            <span>{new Date(creation.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Prompt Preview */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        <span className="font-medium">Prompt:</span> {creation.prompt}
                      </p>


                      {/* Actions and Social */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex gap-3">
                          <LikeButton creationId={creation.id} />
                          <CommentsSection creationId={creation.id} />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCreation(creation)} title="View details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AddToCollectionDialog creationId={creation.id} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleTogglePublic(creation.id, creation.is_public)}
                            title={creation.is_public ? "Make private" : "Make public"}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Creation?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete "{creation.title}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(creation.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "space-y-6"}>
              {filteredCreations.map((creation, i) => (
                <Card 
                  key={creation.id} 
                  className="group overflow-hidden bg-card/50 backdrop-blur-xl border-border hover:border-primary/50 transition-all duration-300 animate-fade-in cursor-pointer" 
                  style={{animationDelay: `${i*0.05}s`}} 
                  onClick={() => setSelectedCreation(creation)}
                >
                  {/* Content Preview Section */}
                  <div className="relative w-full">
                    {creation.type === 'image' ? (
                      <div className="relative h-56 bg-muted/30 overflow-hidden">
                        <img src={creation.content} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={creation.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <ImageIcon className="absolute top-3 left-3 w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div className="relative h-56 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-primary/10 flex items-center justify-center p-6">
                        <FileText className="w-16 h-16 text-primary/40 absolute" />
                        <p className="relative z-10 text-sm text-foreground/60 line-clamp-6 text-center">{creation.content}</p>
                        <FileText className="absolute top-3 left-3 w-5 h-5 text-primary" />
                      </div>
                    )}
                    {creation.is_public && (
                      <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm rounded-full p-1.5">
                        <Globe className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">{creation.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(creation.type)} bg-clip-text text-transparent`}>
                          {creation.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      <span className="font-medium">Prompt:</span> {creation.prompt}
                    </p>


                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
            <AlertDialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header with Close Button */}
              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div className="flex-1 pr-8">
                  <AlertDialogTitle className="text-2xl font-bold mb-2">{selectedCreation.title}</AlertDialogTitle>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedCreation.type)} bg-clip-text text-transparent`}>
                      {selectedCreation.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedCreation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                  onClick={() => setSelectedCreation(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <AlertDialogDescription className="flex-1 overflow-y-auto py-6 space-y-6">
                {/* Prompt Section */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Prompt
                  </h4>
                  <p className="text-foreground/80 bg-muted/50 rounded-lg p-4 border border-border/50">
                    {selectedCreation.prompt}
                  </p>
                </div>

                {/* Content Section */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Generated Content</h4>
                  <div className="rounded-lg overflow-hidden border border-border/50">
                    {selectedCreation.type === 'image' ? (
                      <img src={selectedCreation.content} className="w-full" alt={selectedCreation.title} />
                    ) : (
                      <div className="bg-muted/50 p-6">
                        <p className="text-foreground/80 whitespace-pre-wrap">{selectedCreation.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDialogDescription>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex gap-3">
                  <LikeButton creationId={selectedCreation.id} />
                  <CommentsSection creationId={selectedCreation.id} />
                </div>
                <AlertDialogCancel className="m-0">Close</AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </div>
  );
};

export default Library;
