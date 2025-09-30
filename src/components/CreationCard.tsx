import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface CreationCardProps {
  title: string;
  description: string;
  icon: string;
  gradient: string;
  onClick: () => void;
}

export const CreationCard = ({ title, description, icon, gradient, onClick }: CreationCardProps) => {
  return (
    <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-xl border-border hover:border-primary/50 transition-all duration-500 cursor-pointer animate-fade-in">
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Animated glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
      </div>
      
      <div className="relative p-8 flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
          <div className="relative w-28 h-28 rounded-2xl bg-card flex items-center justify-center border border-border group-hover:border-primary/50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-purple">
            <img src={icon} alt={title} className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-2xl font-bold group-hover:text-gradient-primary transition-all duration-300">{title}</h3>
          <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{description}</p>
        </div>

        <Button 
          variant="ghost" 
          className="mt-6 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300"
          onClick={onClick}
        >
          <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
          Create Now
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2 duration-300" />
        </Button>
      </div>
    </Card>
  );
};
