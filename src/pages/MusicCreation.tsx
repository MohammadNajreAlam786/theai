import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Save, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

const MusicCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe the music you want to create",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-music", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      setAudioUrl(data.audioUrl);
      toast({
        title: "Music generated!",
        description: "Your music is ready to play",
      });
    } catch (error: any) {
      console.error("Error generating music:", error);
      
      let errorTitle = "Generation failed";
      let errorDescription = "Failed to generate music. Please try again.";
      
      // Check for specific error types
      if (error.message?.includes("503") || error.message?.toLowerCase().includes("service unavailable")) {
        errorTitle = "Service temporarily unavailable";
        errorDescription = "The music generation service is currently experiencing high demand. Please try again in a few moments.";
      } else if (error.message?.includes("429")) {
        errorTitle = "Too many requests";
        errorDescription = "Please wait a moment before trying again.";
      } else if (error.message) {
        errorDescription = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioUrl) return;

    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSave = async () => {
    if (!audioUrl || !user) {
      toast({
        title: "Cannot save",
        description: "Please generate music first and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    const finalTitle = title.trim() || "Untitled Music";

    try {
      const { error } = await supabase.from("creations").insert({
        user_id: user.id,
        type: "music",
        title: finalTitle,
        prompt,
        content: audioUrl,
      });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Your music has been saved to your library",
      });

      navigate("/library");
    } catch (error: any) {
      console.error("Error saving music:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save music",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Music Composition
            </h1>
            <div className="w-[140px]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Music Description</label>
            <Textarea
              placeholder="Describe the music you want to create... (e.g., 'Upbeat electronic dance music with energetic beats and synthesizers')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                Generating Music...
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                Generate Music
              </>
            )}
          </Button>

          {/* Audio Player */}
          {audioUrl && (
            <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Play
                    </>
                  )}
                </Button>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title (optional)</label>
                <Input
                  placeholder="Give your music a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                variant="outline"
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                Save to Library
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default MusicCreation;
