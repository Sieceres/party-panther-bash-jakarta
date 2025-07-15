import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { ReviewsList } from "./ReviewsList";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
}

interface PromoCardProps {
  promo: Promo;
  onClaim?: (promoId: string) => void;
}

export const PromoCard = ({ promo, onClaim }: PromoCardProps) => {
  const navigate = useNavigate();
  const [showReviews, setShowReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const handleReviewsChange = (avgRating: number, total: number) => {
    setAverageRating(avgRating);
    setTotalReviews(total);
  };

  return (
    <Card className="group hover:scale-105 transition-all duration-300 bg-card border-border hover:border-neon-pink/50 overflow-hidden">
      {/* Promo Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={promo.image || promo.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop'}
          alt={promo.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop';
          }}
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-neon-pink text-black font-bold text-lg px-3 py-1 neon-glow">
            {promo.discount}
          </Badge>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-black/50 text-white">
            {promo.category}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-neon-pink transition-colors">
          {promo.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{promo.description}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{promo.venue}</p>
            <p className="text-xs text-muted-foreground">Valid until {promo.validUntil}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground line-through">
                {promo.originalPrice}
              </span>
              <span className="font-bold text-neon-pink">{promo.discountedPrice}</span>
            </div>
          </div>
        </div>

        {/* Rating/Reviews */}
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span>{totalReviews > 0 ? averageRating.toFixed(1) : "No rating"}</span>
            <span>•</span>
            <span>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReviews(!showReviews)}
            className="text-xs"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {showReviews ? "Hide" : "Reviews"}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex-col space-y-4">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/promo/${promo.id}`)}
          >
            View Details
          </Button>
          <Button
            className="flex-1 bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold"
            onClick={() => onClaim?.(promo.id)}
          >
            Claim Promo
          </Button>
        </div>
        
        {/* Reviews Section */}
        <div className={cn("w-full", { "hidden": !showReviews })}>
          <ReviewsList 
            promoId={promo.id} 
            onReviewsChange={handleReviewsChange}
          />
        </div>
      </CardFooter>
    </Card>
  );
};