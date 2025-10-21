import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, MessageSquare, Edit2, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewsList } from "./ReviewsList";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Promo {
  id: string;
  title: string;
  description: string;
  discount: string;
  venue: string;
  validUntil: string;
  image: string;
  image_url?: string;
  category: string;
  day: string[] | string;
  area: string;
  drinkType: string[] | string;
  created_by?: string;
  // Optimized data fields
  creator_name?: string;
  creator_avatar?: string;
  creator_verified?: boolean;
  average_rating?: number;
  total_reviews?: number;
  is_favorite?: boolean;
}

interface PromoCardProps {
  promo: Promo;
  userAdminStatus?: { is_admin: boolean; is_super_admin: boolean } | null;
  onFavoriteToggle?: (promoId: string, isFavorite: boolean) => void;
  index?: number;
}

import { format } from "date-fns";
import { getPromoUrl, getEditPromoUrl } from "@/lib/slug-utils";

export const PromoCard = ({ promo, userAdminStatus, onFavoriteToggle, index = 0 }: PromoCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showReviews, setShowReviews] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Use optimized data or fallback to defaults
  const averageRating = promo.average_rating || 0;
  const totalReviews = Number(promo.total_reviews) || 0;
  const creatorName = promo.creator_name || 'Anonymous';
  const isFavorite = promo.is_favorite || false;

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  const handleCardClick = () => {
    navigate(getPromoUrl(promo));
  };

  const handleReviewsChange = (avgRating: number, total: number) => {
    // This function can be kept for ReviewsList compatibility but doesn't need to update state
    // since we're using optimized data from the hook
  };

  const handleEdit = () => {
    navigate(getEditPromoUrl(promo));
  };

  const handleDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "Please log in to delete promos.",
        variant: "destructive"
      });
      return;
    }

    // Check if user is owner or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    const isAdmin = profile?.is_admin || profile?.is_super_admin || false;
    const isOwner = user.id === promo.created_by;
    
    if (!isOwner && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You can only delete your own promos or need admin privileges.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('promos')
        .delete()
        .eq('id', promo.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Promo deleted successfully!"
      });

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting promo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorite promos.",
        variant: "destructive"
      });
      return;
    }

    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorite_promos')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('promo_id', promo.id);

        if (error) throw error;

        // Optimistic update
        onFavoriteToggle?.(promo.id, false);
        toast({
          title: "Removed from favorites",
          description: "Promo removed from your favorites!"
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorite_promos')
          .insert({ user_id: currentUser.id, promo_id: promo.id });

        if (error) throw error;

        // Optimistic update
        onFavoriteToggle?.(promo.id, true);
        toast({
          title: "Added to favorites",
          description: "Promo added to your favorites!"
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      onFavoriteToggle?.(promo.id, !isFavorite);
      toast({
        title: "Error",
        description: error.message || "Failed to update favorite status",
        variant: "destructive"
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const isOwner = currentUser && currentUser.id === promo.created_by;
  const isAdmin = userAdminStatus?.is_admin || userAdminStatus?.is_super_admin || false;
  const canDelete = isOwner || isAdmin;

  return (
    <Card 
      className="promo-card-enhanced cursor-pointer animate-stagger-in hover:border-primary/50 transition-all duration-300 flex flex-col h-full" 
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-t-2xl bg-muted">
        <img
          src={promo.image || promo.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop'}
          alt={promo.title}
          className="promo-card-image w-full h-48 object-cover object-center transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop';
          }}
        />
        <div className="promo-image-overlay absolute inset-0"></div>
        {promo.discount && (
          <div className={cn(
            "neon-tag absolute top-3",
            currentUser && !isOwner ? "right-12" : "right-3"
          )}>
            {promo.discount}
          </div>
        )}
        {promo.category && (
          <div className="neon-tag absolute top-3 left-3">
            {promo.category}
          </div>
        )}
        {canDelete && (
          <div className="absolute top-3 right-20 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 h-8 w-8"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Promo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this promo? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {/* Favorite button - visible to authenticated users */}
        {currentUser && !isOwner && (
          <div className="absolute top-3 right-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              className={cn(
                "p-2 h-8 w-8 transition-colors duration-200",
                isFavorite 
                  ? "bg-pink-600 hover:bg-pink-700 text-white" 
                  : "bg-white/80 hover:bg-white text-pink-600"
              )}
              disabled={isTogglingFavorite}
            >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
          </div>
        )}
        
        {/* Hover "Claim Promo" Button */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 p-3 sm:p-4 transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Button
            variant="cta"
            size="default"
            className="w-full min-h-[44px] font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            View Promo Details
          </Button>
        </div>
      </div>

      <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-5">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors break-words">{promo.title}</h3>
        <p className="text-sm sm:text-base line-clamp-2 text-muted-foreground break-words">{promo.description}</p>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-5 pt-0 flex-grow">
        <div className="space-y-2">
          <p className="text-sm sm:text-base font-semibold text-white truncate">{promo.venue}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Valid until {promo.validUntil}</p>
          {creatorName && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">by {creatorName}</span>
            </div>
          )}
        </div>

        {/* Rating/Reviews */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span>{totalReviews > 0 ? averageRating.toFixed(1) : "No rating"}</span>
            <span>•</span>
            <span>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
          </div>
          <Button
            variant="ghost"
            size="default"
            onClick={(e) => {
              e.stopPropagation();
              setShowReviews(!showReviews);
            }}
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary min-h-[36px] px-3"
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            {showReviews ? "Hide" : "Reviews"}
          </Button>
        </div>
      </CardContent>

      {/* Reviews Section */}
      {showReviews && (
        <CardFooter className="p-4 sm:p-5 pt-0">
          <ReviewsList 
            promoId={promo.id} 
            onReviewsChange={handleReviewsChange}
          />
        </CardFooter>
      )}
    </Card>
  );
};