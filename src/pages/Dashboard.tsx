import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreationCard } from "@/components/CreationCard";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, User, Library } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import textIcon from "@/assets/text-icon.png";
import imageIcon from "@/assets/image-icon.png";
import musicIcon from "@/assets/music-icon.png";
import videoIcon from "@/assets/video-icon.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
      gradient: "bg-gradient-orange",
      route: "/create/video"
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-primary rounded-full blur-3xl opacity-10 animate-float" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-gradient-accent rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="relative z-50 border-b border-border bg-card/40 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <Sparkles className="w-8 h-8 text-primary group-hover:animate-pulse transition-all" />
            <h1 className="text-2xl font-bold text-gradient-primary">
              MuseAI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="glass" 
              size="sm" 
              className="hover:shadow-glow-purple transition-all duration-300"
              onClick={() => navigate('/library')}
            >
              <Library className="w-4 h-4" />
              My Library
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:text-primary transition-colors"
              onClick={() => navigate('/profile')}
            >
              <User className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:text-destructive transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-5xl md:text-6xl font-bold text-gradient animate-slide-up">
            What will you create today?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Choose your creative medium and let AI bring your vision to life
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-24">
          {creations.map((creation, index) => (
            <div key={creation.title} style={{ animationDelay: `${index * 0.1}s` }}>
              <CreationCard
                {...creation}
                onClick={() => navigate(creation.route)}
              />
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
