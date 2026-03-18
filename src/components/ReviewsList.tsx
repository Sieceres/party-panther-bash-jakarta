import { useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js"; 
import { Star, Edit, Trash2, Reply, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReviewForm } from "./ReviewForm";
import { ReviewReplyForm } from "./ReviewReplyForm";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import defaultAvatar from "@/assets/default-avatar.png";

interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: { display_name: string; avatar_url?: string };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_anonymous: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
  reply?: ReviewReply | null;
}

interface ReviewsListProps {
  promoId: string;
  venueOwnerId?: string | null;
  onReviewsChange?: (averageRating: number, totalReviews: number) => void;
}

export const ReviewsList = ({ promoId, venueOwnerId, onReviewsChange }: ReviewsListProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('promo_reviews')
        .select('*')
        .eq('promo_id', promoId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch profiles and replies in parallel for each review
      const reviewsWithDetails = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const [profileRes, replyRes] = await Promise.all([
            supabase.from('profiles').select('display_name, avatar_url, is_verified').eq('user_id', review.user_id).single(),
            supabase.from('review_replies').select('*').eq('review_id', review.id).maybeSingle(),
          ]);

          let replyWithProfile: ReviewReply | null = null;
          if (replyRes.data) {
            const { data: replyProfile } = await supabase
              .from('profiles').select('display_name, avatar_url').eq('user_id', replyRes.data.user_id).single();
            replyWithProfile = { ...replyRes.data, profiles: replyProfile || undefined };
          }

          return {
            ...review,
            is_anonymous: review.is_anonymous || false,
            profiles: profileRes.data,
            reply: replyWithProfile,
          };
        })
      );

      setReviews(reviewsWithDetails);
      
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
    if (user) {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'superadmin']);
      setIsAdmin(!!(data && data.length > 0));
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchCurrentUser();
  }, [fetchReviews, fetchCurrentUser]);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.from('promo_reviews').delete().eq('id', reviewId);
      if (error) throw error;
      toast({ title: "Review deleted", description: "Your review has been removed." });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({ title: "Error deleting review", description: "Please try again later.", variant: "destructive" });
    }
  };

  const userHasReviewed = reviews.some(review => review.user_id === currentUser?.id);
  const isVenueOwner = !!(currentUser && venueOwnerId && currentUser.id === venueOwnerId);
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 10);
  
  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const getReviewerDisplay = (review: Review) => {
    if (review.is_anonymous && !isAdmin && currentUser?.id !== review.user_id) {
      return { name: "Anonymous Reviewer", avatar: null, showAvatar: false };
    }
    const name = review.profiles?.display_name || "Anonymous";
    const suffix = review.is_anonymous && (isAdmin || currentUser?.id === review.user_id) ? " (anonymous)" : "";
    return { name: name + suffix, avatar: review.profiles?.avatar_url, showAvatar: true };
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
      {currentUser && !userHasReviewed && !showReviewForm && !editingReview && (
        <Button onClick={() => setShowReviewForm(true)} className="w-full bg-primary hover:bg-primary/90">
          Write a Review
        </Button>
      )}

      {showReviewForm && (
        <ReviewForm
          promoId={promoId}
          onReviewSubmitted={() => { setShowReviewForm(false); fetchReviews(); }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {editingReview && (
        <ReviewForm
          promoId={promoId}
          existingReview={{ ...editingReview, is_anonymous: editingReview.is_anonymous }}
          onReviewSubmitted={() => { setEditingReview(null); fetchReviews(); }}
          onCancel={() => setEditingReview(null)}
        />
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
          No reviews yet. Be the first to review this promo!
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold">Reviews ({reviews.length})</h3>
          {displayedReviews.map((review) => {
            const reviewer = getReviewerDisplay(review);
            return (
              <div key={review.id} className="p-3 sm:p-4 md:p-5 bg-muted/50 rounded-lg space-y-2 sm:space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar 
                    className={`w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 ${reviewer.showAvatar ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                    onClick={() => reviewer.showAvatar && handleProfileClick(review.user_id)}
                  >
                    {reviewer.showAvatar ? (
                      <AvatarImage src={reviewer.avatar || defaultAvatar} />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <AvatarFallback className="text-xs sm:text-sm">
                      {review.is_anonymous && !isAdmin && currentUser?.id !== review.user_id ? "?" : reviewer.name[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span 
                          className={`text-sm sm:text-base font-medium truncate ${reviewer.showAvatar ? "cursor-pointer hover:text-primary transition-colors" : "italic text-muted-foreground"}`}
                          onClick={() => reviewer.showAvatar && handleProfileClick(review.user_id)}
                        >
                          {reviewer.name}
                        </span>
                        {review.profiles?.is_verified && !review.is_anonymous && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Verified</Badge>
                        )}
                      </div>
                      {currentUser?.id === review.user_id && !editingReview && !showReviewForm && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => setEditingReview(review)} className="h-8 w-8 p-0">
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteReview(review.id)} className="h-8 w-8 p-0">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    {review.comment && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{review.comment}</p>
                    )}

                    {/* Venue Owner Reply */}
                    {review.reply && (
                      <div className="ml-4 mt-2 p-3 bg-accent/30 rounded-md border-l-2 border-primary/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Reply className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium">{review.reply.profiles?.display_name || "Venue Owner"}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Venue Owner</Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{review.reply.comment}</p>
                      </div>
                    )}

                    {/* Reply button for venue owner */}
                    {isVenueOwner && !review.reply && replyingTo !== review.id && (
                      <Button size="sm" variant="ghost" onClick={() => setReplyingTo(review.id)} className="text-xs gap-1 h-7 px-2">
                        <Reply className="w-3 h-3" /> Reply
                      </Button>
                    )}

                    {/* Reply form */}
                    {replyingTo === review.id && (
                      <ReviewReplyForm
                        reviewId={review.id}
                        onSubmitted={() => { setReplyingTo(null); fetchReviews(); }}
                        onCancel={() => setReplyingTo(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {reviews.length > 10 && !showAllReviews && (
            <Button variant="outline" className="w-full" onClick={() => setShowAllReviews(true)}>
              See all {reviews.length} reviews
            </Button>
          )}
          
          {showAllReviews && reviews.length > 10 && (
            <Button variant="ghost" className="w-full" onClick={() => setShowAllReviews(false)}>
              Show less
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
