import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreationCard } from "@/components/CreationCard";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";
import textIcon from "@/assets/text-icon.png";
import imageIcon from "@/assets/image-icon.png";
import musicIcon from "@/assets/music-icon.png";
import videoIcon from "@/assets/video-icon.png";

const Dashboard = () => {
  const navigate = useNavigate();

  const creations = [
    {
      title: "Text Generation",
      description: "Create stories, poetry, scripts, and more with AI-powered writing",
      icon: textIcon,
      gradient: "bg-gradient-primary",
      route: "/create/text"
    },
    {
      title: "Image Creation",
      description: "Generate stunning artwork, illustrations, and concept designs",
      icon: imageIcon,
      gradient: "bg-gradient-secondary",
      route: "/create/image"
    },
    {
      title: "Music Composition",
      description: "Compose melodies, generate lyrics, and create soundscapes",
      icon: musicIcon,
      gradient: "bg-gradient-accent",
      route: "/create/music"
    },
    {
      title: "Video Production",
      description: "Produce short clips, animations, and storyboards",
      icon: videoIcon,
      gradient: "bg-gradient-primary",
      route: "/create/video"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-primary">
              MuseAI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="glass" size="sm">
              My Library
            </Button>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">What will you create today?</h2>
          <p className="text-xl text-muted-foreground">
            Choose your creative medium and let AI bring your vision to life
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {creations.map((creation) => (
            <CreationCard
              key={creation.title}
              {...creation}
              onClick={() => navigate(creation.route)}
            />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-card/30 backdrop-blur-xl border border-border">
            <div className="text-4xl font-bold text-primary mb-2">10M+</div>
            <div className="text-muted-foreground">Creations Generated</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-card/30 backdrop-blur-xl border border-border">
            <div className="text-4xl font-bold text-primary mb-2">500K+</div>
            <div className="text-muted-foreground">Active Creators</div>
          </div>
          <div className="text-center p-6 rounded-xl bg-card/30 backdrop-blur-xl border border-border">
            <div className="text-4xl font-bold text-primary mb-2">4.9★</div>
            <div className="text-muted-foreground">User Rating</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
