import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
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

      {/* Animated mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-pulse animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-accent rounded-full blur-3xl opacity-20 animate-pulse animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-secondary rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            AI-Powered Creativity
          </span>
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-gradient-primary animate-glow">Muse</span>
          <span className="text-gradient">AI</span>
        </h1>
        
        <p className="text-xl md:text-3xl text-foreground/90 mb-6 max-w-3xl mx-auto font-medium animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Transform your imagination into reality
        </p>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
          Create stunning text, images, and music with the power of AI.
          Your creative journey starts here.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg" 
            variant="hero"
            onClick={() => navigate('/dashboard')}
            className="text-lg px-10 py-7 group shadow-glow-purple hover:shadow-glow-pink"
          >
            <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Start Creating
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="lg" 
            variant="glass"
            onClick={() => navigate('/auth')}
            className="text-lg px-10 py-7"
          >
            Sign In
          </Button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-4 justify-center mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {['Text Generation', 'Image Creation', 'Music Composition'].map((feature, index) => (
            <div 
              key={feature}
              className="px-6 py-3 rounded-full bg-card/40 backdrop-blur-xl border border-border hover:border-primary/50 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-glow-purple cursor-default animate-slide-in"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
