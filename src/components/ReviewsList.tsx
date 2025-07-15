import { useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js"; 
import { Star, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReviewForm } from "./ReviewForm";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
}

interface ReviewsListProps {
  promoId: string;
  onReviewsChange?: (averageRating: number, totalReviews: number) => void;
}

export const ReviewsList = ({ promoId, onReviewsChange }: ReviewsListProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('promo_reviews')
        .select('*')
        .eq('promo_id', promoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Calculate average rating and total reviews
      if (data && data.length > 0) {
        const avgRating = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        onReviewsChange?.(avgRating, data.length);
      } else {
        onReviewsChange?.(0, 0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      onReviewsChange?.(0, 0);
    } finally {
      setLoading(false);
    }
  }, [promoId, onReviewsChange]);

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchCurrentUser();
  }, [fetchReviews, fetchCurrentUser]);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('promo_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "Your review has been removed.",
      });

      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error deleting review",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const userHasReviewed = reviews.some(review => review.user_id === currentUser?.id);

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add Review Button */}
      {currentUser && !userHasReviewed && !showReviewForm && !editingReview && (
        <Button
          onClick={() => setShowReviewForm(true)}
          className="w-full bg-primary hover:bg-primary/90"
        >
          Write a Review
        </Button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          promoId={promoId}
          onReviewSubmitted={() => {
            setShowReviewForm(false);
            fetchReviews();
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Edit Review Form */}
      {editingReview && (
        <ReviewForm
          promoId={promoId}
          existingReview={editingReview}
          onReviewSubmitted={() => {
            setEditingReview(null);
            fetchReviews();
          }}
          onCancel={() => setEditingReview(null)}
        />
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reviews yet. Be the first to review this promo!
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold">Reviews ({reviews.length})</h3>
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-card rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    Anonymous
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Edit/Delete buttons for user's own review */}
                {currentUser?.id === review.user_id && !editingReview && !showReviewForm && (
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingReview(review)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};