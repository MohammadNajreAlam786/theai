import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

const ComingSoon = ({ title, description }: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="max-w-2xl w-full p-12 text-center bg-card/50 backdrop-blur-xl border-border">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-primary/10 flex items-center justify-center">
              <Clock className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          <p className="text-xl text-muted-foreground mb-8">{description}</p>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This feature is currently under development. We're working hard to bring you
              the best AI-powered creative tools.
            </p>
            
            <Button
              onClick={() => navigate('/dashboard')}
              variant="hero"
              size="lg"
            >
              Back to Dashboard
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Want to be notified when this launches? Contact us to join the waitlist.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ComingSoon;
