import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewReplyFormProps {
  reviewId: string;
  existingReply?: { id: string; comment: string };
  onSubmitted: () => void;
  onCancel: () => void;
}

export const ReviewReplyForm = ({ reviewId, existingReply, onSubmitted, onCancel }: ReviewReplyFormProps) => {
  const { toast } = useToast();
  const [comment, setComment] = useState(existingReply?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (existingReply) {
        const { error } = await supabase
          .from("review_replies")
          .update({ comment: comment.trim(), updated_at: new Date().toISOString() })
          .eq("id", existingReply.id);
        if (error) throw error;
        toast({ title: "Reply updated" });
      } else {
        const { error } = await supabase
          .from("review_replies")
          .insert({ review_id: reviewId, user_id: user.id, comment: comment.trim() });
        if (error) throw error;
        toast({ title: "Reply posted" });
      }
      onSubmitted();
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast({ title: "Error", description: error.message || "Could not post reply.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 ml-12 mt-2">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Reply to this review as the venue owner..."
        className="min-h-16 text-sm"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting || !comment.trim()}>
          {isSubmitting ? "Posting..." : existingReply ? "Update Reply" : "Post Reply"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
