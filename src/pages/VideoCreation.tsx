import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Download, Save } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const VideoCreation = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        toast.success("Video generated successfully!");
      } else {
        throw new Error("No video URL returned");
      }
    } catch (error: any) {
      console.error('Error generating video:', error);
      
      let errorMessage = "Failed to generate video";
      
      if (error.message?.includes("not configured")) {
        errorMessage = "Video generation is not configured. Please contact support to enable this feature.";
      } else if (error.message?.includes("503") || error.message?.toLowerCase().includes("service unavailable")) {
        errorMessage = "The video generation service is temporarily unavailable. Please try again later.";
      } else if (error.message?.includes("429")) {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedVideo || !title.trim()) {
      toast.error("Please provide a title and generate a video first");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('creations')
        .insert({
          user_id: user?.id,
          type: 'video',
          title: title,
          content: generatedVideo,
          prompt: prompt
        });

      if (error) throw error;
      
      toast.success("Video saved to library!");
      navigate('/library');
    } catch (error: any) {
      console.error('Error saving video:', error);
      toast.error("Failed to save video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideo) return;
    
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `${title || 'video'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      
      <div className="relative">
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Video Production
                </h1>
              </div>
              <Button 
                onClick={handleSave}
                disabled={!generatedVideo || isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save to Library
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 shadow-xl">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Input</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Title
                  </label>
                  <Input
                    placeholder="Give your video a title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Describe your video
                  </label>
                  <Textarea
                    placeholder="A cinematic shot of a sunset over mountains..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] bg-background/50 border-border/50 resize-none"
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner />
                      Generating Video...
                    </>
                  ) : (
                    'Generate Video'
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Output</h2>
                {generatedVideo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>

              <div className="aspect-video bg-background/50 border-2 border-dashed border-border/50 rounded-lg overflow-hidden">
                {generatedVideo ? (
                  <video
                    src={generatedVideo}
                    controls
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {isGenerating ? (
                      <div className="text-center space-y-4">
                        <LoadingSpinner />
                        <p>Generating your video... This may take a few minutes</p>
                      </div>
                    ) : (
                      <p>Your video will appear here</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VideoCreation;