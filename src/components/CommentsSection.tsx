import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentsSectionProps {
  creationId: string;
}

export const CommentsSection = ({ creationId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      loadComments();
      subscribeToComments();
    }
  }, [creationId, isExpanded]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('creation_id', creationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p]) || []
        );

        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id)
        }));

        setComments(commentsWithProfiles as Comment[]);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error("Failed to load comments");
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`comments-${creationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `creation_id=eq.${creationId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          creation_id: creationId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      toast.success("Comment added!");
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success("Comment deleted");
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error("Failed to delete comment");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="gap-2"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm">Comments ({comments.length})</span>
      </Button>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-card/50 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          Close
        </Button>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-background/50 border-border/50 min-h-[80px]"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Post Comment
          </Button>
        </form>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 bg-background/30 rounded-lg">
            <Avatar className="h-10 w-10">
              {comment.profiles?.avatar_url ? (
                <AvatarImage src={comment.profiles.avatar_url} />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  {getInitials(comment.profiles?.full_name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {comment.profiles?.full_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
                {user?.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};