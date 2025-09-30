import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-accent rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            AI-Powered Creativity
          </span>
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground">
          MuseAI
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          Transform your imagination into reality
        </p>
        
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          Create stunning text, images, music, and video with the power of AI.
          Your creative journey starts here.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            variant="hero"
            onClick={() => navigate('/dashboard')}
            className="text-lg px-8 py-6"
          >
            <Zap className="w-5 h-5" />
            Start Creating
          </Button>
          <Button 
            size="lg" 
            variant="glass"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Sign In
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-4 justify-center mt-16">
          {['Text Generation', 'Image Creation', 'Music Composition', 'Video Production'].map((feature) => (
            <div 
              key={feature}
              className="px-6 py-3 rounded-full bg-card/30 backdrop-blur-xl border border-border text-sm font-medium"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
