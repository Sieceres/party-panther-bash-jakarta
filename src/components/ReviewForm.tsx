import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  promoId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  };
  onReviewSubmitted: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ promoId, existingReview, onReviewSubmitted, onCancel }: ReviewFormProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Rating is required to submit a review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to leave a review.",
          variant: "destructive",
        });
        return;
      }

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('promo_reviews')
          .update({
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReview.id);

        if (error) throw error;

        toast({
          title: "Review updated! ⭐",
          description: "Your review has been updated successfully.",
        });
      } else {
        // Create new review
        const { error } = await supabase
          .from('promo_reviews')
          .insert({
            promo_id: promoId,
            user_id: user.id,
            rating,
            comment: comment.trim() || null,
          });

        if (error) throw error;

        toast({
          title: "Review submitted! ⭐",
          description: "Thank you for your feedback!",
        });
      }

      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error submitting review",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5 md:p-6 bg-card rounded-lg border">
      <h3 className="text-lg sm:text-xl font-semibold">
        {existingReview ? "Edit Your Review" : "Write a Review"}
      </h3>
      
      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Rating</label>
        <div className="flex items-center gap-1 sm:gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 hover:scale-110 transition-transform touch-manipulation"
            >
              <Star
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  star <= (hoveredRating || rating)
                    ? "text-yellow-400 fill-current"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Comment (optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this promo..."
          className="min-h-20 text-sm sm:text-base"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="bg-primary hover:bg-primary/90 text-sm sm:text-base"
        >
          {isSubmitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-sm sm:text-base"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};