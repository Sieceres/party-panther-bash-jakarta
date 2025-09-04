import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, MessageSquare, Edit2, Trash2 } from "lucide-react";
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
  originalPrice: string;
  discountedPrice: string;
  day: string;
  area: string;
  drinkType: string;
  created_by?: string;
}

interface PromoCardProps {
  promo: Promo;
  onClaim?: (promoId: string) => void;
}

import { format } from "date-fns";

export const PromoCard = ({ promo, onClaim }: PromoCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showReviews, setShowReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCreator = async () => {
      if (promo.created_by) {
        const { data: profile } = await supabase
          .rpc('get_safe_profile_info', { profile_user_id: promo.created_by });
        
        if (profile && profile.length > 0) {
          setCreatorName(profile[0]?.display_name || 'Anonymous');
        } else {
          setCreatorName('Anonymous');
        }
      }
    };

    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    fetchCreator();
    getCurrentUser();
  }, [promo.created_by]);

  const handleCardClick = () => {
    navigate(`/promo/${promo.id}`);
  };

  const handleReviewsChange = (avgRating: number, total: number) => {
    setAverageRating(avgRating);
    setTotalReviews(total);
  };

  const handleEdit = () => {
    navigate(`/edit-promo/${promo.id}`);
  };

  const handleDelete = async () => {
    if (!currentUser || currentUser.id !== promo.created_by) {
      toast({
        title: "Unauthorized",
        description: "You can only delete your own promos.",
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

  const isOwner = currentUser && currentUser.id === promo.created_by;

  return (
    <Card className="neon-card bg-card/95 backdrop-blur-sm border border-border/50 group cursor-pointer" onClick={handleCardClick}>
      <div className="relative overflow-hidden">
        <img 
          src={promo.image || promo.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop'}
          alt={promo.title}
          className="card-image w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop';
          }}
        />
        <div className="image-overlay absolute inset-0"></div>
        {promo.discount && (
          <div className="neon-tag absolute top-3 right-3">
            {promo.discount}
          </div>
        )}
        {promo.category && (
          <div className="neon-tag absolute top-3 left-3">
            {promo.category}
          </div>
        )}
        {isOwner && (
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
      </div>

      <CardHeader className="pb-3">
        <h3 className="text-xl font-bold text-white mb-1 line-clamp-2" style={{ fontSize: '20px' }}>{promo.title}</h3>
        <p className="text-sm line-clamp-2 whitespace-pre-wrap" style={{ color: '#E0E0E0', fontSize: '14px' }}>{promo.description}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{promo.venue}</p>
            <p className="text-xs" style={{ color: '#E0E0E0' }}>Valid until {promo.validUntil}</p>
            {creatorName && (
              <div className="flex items-center space-x-1 text-xs" style={{ color: '#E0E0E0' }}>
                <User className="w-3 h-3" />
                <span>by {creatorName}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground line-through">
                {promo.originalPrice}
              </span>
              <span className="font-bold text-white">{promo.discountedPrice}</span>
            </div>
          </div>
        </div>

        {/* Rating/Reviews */}
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 text-sm" style={{ color: '#E0E0E0' }}>
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span>{totalReviews > 0 ? averageRating.toFixed(1) : "No rating"}</span>
            <span>•</span>
            <span>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowReviews(!showReviews);
            }}
            className="text-xs text-white hover:text-primary"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {showReviews ? "Hide" : "Reviews"}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={(e) => {
          e.stopPropagation();
          navigate(`/promo/${promo.id}`);
        }}>
          View Details
        </Button>
        <button 
          className="cta-button"
          onClick={(e) => {
            e.stopPropagation();
            onClaim && onClaim(promo.id);
          }}
        >
          Claim Promo
        </button>
        
        {/* Reviews Section */}
        <div className={cn("w-full mt-4", { "hidden": !showReviews })}>
          <ReviewsList 
            promoId={promo.id} 
            onReviewsChange={handleReviewsChange}
          />
        </div>
      </CardFooter>
    </Card>
  );
};