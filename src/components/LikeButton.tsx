import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  creationId: string;
  className?: string;
}

export const LikeButton = ({ creationId, className }: LikeButtonProps) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLikes();

    const channel = supabase
      .channel(`likes-${creationId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `creation_id=eq.${creationId}`,
        },
        () => {
          loadLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creationId, user]);

  const loadLikes = async () => {
    try {
      // Get total like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('creation_id', creationId);

      setLikeCount(count || 0);

      // Check if current user has liked
      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('creation_id', creationId)
          .eq('user_id', user.id)
          .single();

        setIsLiked(!!data);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };




  const toggleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like creations");
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('creation_id', creationId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            creation_id: creationId,
            user_id: user.id
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all",
          isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
      <span className="text-sm">{likeCount}</span>
    </Button>
  );
};