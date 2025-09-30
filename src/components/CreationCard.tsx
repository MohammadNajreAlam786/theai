import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CreationCardProps {
  title: string;
  description: string;
  icon: string;
  gradient: string;
  onClick: () => void;
}

export const CreationCard = ({ title, description, icon, gradient, onClick }: CreationCardProps) => {
  return (
    <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-xl border-border hover:border-primary/50 transition-all duration-500 cursor-pointer">
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      <div className="relative p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 rounded-2xl bg-card flex items-center justify-center border border-border group-hover:border-primary/50 transition-all duration-300 group-hover:scale-110">
          <img src={icon} alt={title} className="w-16 h-16 object-contain" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Button 
          variant="ghost" 
          className="mt-4 group-hover:bg-primary/10"
          onClick={onClick}
        >
          Create Now
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
};
