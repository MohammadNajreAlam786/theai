import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Save, Play, Pause, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    setAudioUrl(null);
    
    try {
      // Step 1: Start music generation
      const { data, error } = await supabase.functions.invoke("generate-music", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      const taskId = data.taskId;
      console.log('Music generation started, task ID:', taskId);

      toast({
        title: "Generation started",
        description: "This will take 60-120 seconds. Please wait...",
      });

      // Step 2: Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts × 5 seconds = 150 seconds max
      
      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error('Music generation timed out. Please try again.');
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "check-music-status",
          { body: { taskId } }
        );

        if (statusError) throw statusError;

        if (statusData.status === 'complete') {
          setAudioUrl(statusData.audioUrl);
          if (statusData.title && !title) {
            setTitle(statusData.title);
          }
          toast({
            title: "Music generated!",
            description: "Your music is ready to play",
          });
        } else if (statusData.status === 'processing') {
          console.log(`Still processing... (attempt ${attempts}/${maxAttempts})`);
          await pollStatus(); // Continue polling
        } else {
          throw new Error('Unknown status: ' + statusData.status);
        }
      };

      await pollStatus();

    } catch (error: any) {
      console.error("Error generating music:", error);
      
      // Check for insufficient credits error
      const errorMessage = error.message || "";
      const isCreditsError = errorMessage.toLowerCase().includes("credits") || 
                            errorMessage.toLowerCase().includes("insufficient");
      
      toast({
        title: isCreditsError ? "API Credits Exhausted" : "Generation failed",
        description: isCreditsError 
          ? "Your Suno API credits have run out. Please top up at sunoapi.org to continue generating music."
          : errorMessage || "Failed to generate music. Please try again.",
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
        {/* Credits Notice */}
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">API Credits Required</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Music generation requires Suno API credits. Please ensure you have sufficient credits before generating.
            <a 
              href="https://sunoapi.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-1 text-primary hover:underline"
            >
              Top up credits <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

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
