import { useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js"; 
import { Star, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReviewForm } from "./ReviewForm";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import defaultAvatar from "@/assets/default-avatar.png";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

interface ReviewsListProps {
  promoId: string;
  onReviewsChange?: (averageRating: number, totalReviews: number) => void;
}

export const ReviewsList = ({ promoId, onReviewsChange }: ReviewsListProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      // First fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('promo_reviews')
        .select('*')
        .eq('promo_id', promoId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then fetch profile info for each review
      const reviewsWithProfiles = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, is_verified')
            .eq('user_id', review.user_id)
            .single();
            
          return {
            ...review,
            profiles: profileData
          };
        })
      );

      setReviews(reviewsWithProfiles);
      
      // Calculate average rating and total reviews
      if (reviewsData && reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        onReviewsChange?.(avgRating, reviewsData.length);
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
  
  // Helper functions for pagination
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 10);
  
  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <SpinningPaws size="sm" />
      </div>
    );
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
          {displayedReviews.map((review) => (
            <div key={review.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Avatar 
                  className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleProfileClick(review.user_id)}
                >
                  <AvatarImage src={review.profiles?.avatar_url || defaultAvatar} />
                  <AvatarFallback>
                    {review.profiles?.display_name?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleProfileClick(review.user_id)}
                      >
                        {review.profiles?.display_name || 'Anonymous'}
                      </span>
                      {review.profiles?.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
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
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {reviews.length > 10 && !showAllReviews && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAllReviews(true)}
            >
              See all {reviews.length} reviews
            </Button>
          )}
          
          {showAllReviews && reviews.length > 10 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAllReviews(false)}
            >
              Show less
            </Button>
          )}
        </div>
      )}
    </div>
  );
};