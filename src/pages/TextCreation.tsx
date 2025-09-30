import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Copy, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TextCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("story");

  const templates = {
    story: "Write a captivating short story about",
    poetry: "Compose a beautiful poem about",
    script: "Create a movie script scene featuring"
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt to generate text.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation (we'll integrate real AI later)
    setTimeout(() => {
      const template = templates[activeTab as keyof typeof templates];
      setGeneratedText(`${template} ${prompt}...\n\n[AI-generated content will appear here once integrated with Lovable AI]\n\nThis is a placeholder for the creative text that will be generated based on your prompt. The actual implementation will use advanced AI models to create compelling stories, poetry, or scripts based on your input.`);
      setIsGenerating(false);
      toast({
        title: "Content Generated!",
        description: "Your creative text is ready."
      });
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Text Generation</h1>
            </div>
          </div>
          
          <Button variant="glass">
            Save to Library
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-8 bg-card/50 backdrop-blur-xl border-border">
            <h2 className="text-2xl font-bold mb-6">Create Your Content</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="poetry">Poetry</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Prompt</label>
                <Textarea
                  placeholder="Describe what you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px] resize-none bg-background/50"
                />
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-8 bg-card/50 backdrop-blur-xl border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Generated Content</h2>
              {generatedText && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="min-h-[400px] p-6 rounded-lg bg-background/50 border border-border">
              {generatedText ? (
                <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {generatedText}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Your generated content will appear here
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TextCreation;
