import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreationCard } from "@/components/CreationCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Sparkles, User, Library, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import textIcon from "@/assets/text-icon.png";
import imageIcon from "@/assets/image-icon.png";
import musicIcon from "@/assets/music-icon.png";
import videoIcon from "@/assets/video-icon.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [recentCreations, setRecentCreations] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }

    if (user) {
      loadRecentActivity();
      loadStats();
    }
  }, [user, loading, navigate]);

  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentCreations(data || []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadStats = async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: allData } = await supabase
        .from('creations')
        .select('created_at')
        .eq('user_id', user?.id);

      const total = allData?.length || 0;
      const thisWeek = allData?.filter(c => new Date(c.created_at) >= weekAgo).length || 0;
      const thisMonth = allData?.filter(c => new Date(c.created_at) >= monthAgo).length || 0;

      setStats({ total, thisWeek, thisMonth });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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

        {/* Analytics & Recent Activity */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 hover:shadow-glow-purple transition-all">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Creations</span>
                <span className="text-2xl font-bold text-primary">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="text-xl font-semibold">{stats.thisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-xl font-semibold">{stats.thisMonth}</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-xl border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Recent Activity</h3>
            </div>
            {recentCreations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentCreations.map((creation) => (
                  <div
                    key={creation.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                    onClick={() => navigate('/library')}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      creation.type === 'text' ? 'bg-gradient-primary' :
                      creation.type === 'image' ? 'bg-gradient-secondary' :
                      creation.type === 'music' ? 'bg-gradient-accent' : 'bg-gradient-orange'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{creation.title}</p>
                      <p className="text-xs text-muted-foreground">{creation.type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(creation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
