import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Download, Loader2, Save, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ImageCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string>("");

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, referenceImage: referenceImage || undefined }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image Generated!",
        description: "Your artwork is ready."
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedImage || !user) return;

    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your creation.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('creations')
        .insert({
          user_id: user.id,
          title: title.trim(),
          type: 'image',
          content: generatedImage,
          prompt: prompt
        });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Your creation has been saved to your library."
      });

      // Clear form
      setPrompt("");
      setTitle("");
      setGeneratedImage("");
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save creation",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `${title || 'creation'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Downloaded!",
      description: "Your image has been downloaded."
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 border-b border-border bg-card/40 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Image Creation</h1>
            </div>
          </div>
          
          {generatedImage && (
            <Button 
              variant="hero" 
              onClick={handleSave}
              disabled={isSaving}
              className="shadow-glow-cyan"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : <><Save className="w-4 h-4" />Save to Library</>}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-8 bg-card/50 backdrop-blur-xl border-border animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">Create Your Artwork</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Give your artwork a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Reference Image (optional)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload an image to keep style/subject consistent across generations.
                </p>
                {referenceImage ? (
                  <div className="relative inline-block">
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => setReferenceImage("")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                    <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleReferenceUpload}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Prompt</label>
                <Textarea
                  placeholder="Describe the image you want to create in detail..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[250px] resize-none bg-background/50"
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Tips for better results:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Be specific about style and mood</li>
                  <li>Mention colors, lighting, and composition</li>
                  <li>Include details about the subject</li>
                  <li>Reference art styles or artists if desired</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                variant="hero"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-8 bg-card/50 backdrop-blur-xl border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Generated Image</h2>
              {generatedImage && (
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="aspect-square rounded-lg bg-background/50 border border-border overflow-hidden">
              {generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt={title || "Generated artwork"} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                  <p>Your generated image will appear here</p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Prompt used:</strong> {prompt}
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ImageCreation;
