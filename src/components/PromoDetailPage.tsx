import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowLeft, Star, Share2 } from "lucide-react";
import { GoogleMap } from "./GoogleMap";
import { ReviewsList } from "./ReviewsList";
import { ReportDialog } from "./ReportDialog";
import { SpinningPaws } from "./ui/spinning-paws";
import { Header } from "./Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPromoBySlugOrId } from "@/lib/slug-utils";
import Linkify from "linkify-react";

interface Promo {
  id: string;
  title: string;
  description: string;
  discount_text: string;
  venue_name: string;
  venue_address: string;
  venue_latitude: number;
  venue_longitude: number;
  original_price_amount: number;
  discounted_price_amount: number;
  price_currency: string;
  valid_until: string;
  day_of_week: string;
  category: string;
  promo_type: string;
  image_url: string;
  area: string;
  drink_type: string;
  created_at: string;
}

export const PromoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchPromo = async () => {
      if (!id) return;
      
      try {
        // Use the slug-aware utility function
        const { data, error } = await getPromoBySlugOrId(id);

        if (error) throw error;
        if (!data) {
          throw new Error('Promo not found');
        }
        setPromo(data as any);
      } catch (error) {
        console.error('Error fetching promo:', error);
        toast({
          title: "Error",
          description: "Failed to load promo details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [id, toast]);

  const handleClaimPromo = () => {
    toast({
      title: "Promo claimed! 🎊",
      description: `"${promo?.title}" has been added to your account. Show this at the venue.`,
    });
  };

  const handleReviewsChange = (avgRating: number, total: number) => {
    setAverageRating(avgRating);
    setTotalReviews(total);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4">
            <SpinningPaws size="lg" />
            <div className="text-center">Loading promo details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto">
          <div className="text-center">Promo not found</div>
        </div>
      </div>
    );
  }

  const markers = promo.venue_latitude && promo.venue_longitude ? [{
    lat: Number(promo.venue_latitude),
    lng: Number(promo.venue_longitude),
    title: promo.venue_name
  }] : [];

  return (
    <>
      <Header activeSection="promos" onSectionChange={(section) => {
        if (section === 'home') navigate('/');
        else if (section === 'profile') navigate('/profile');
        else if (section === 'promos') navigate('/?section=promos');
        else if (section === 'events') navigate('/?section=events');
      }} />
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/?section=promos')}
            className="mb-6 hover:bg-gradient-to-r hover:from-neon-blue hover:to-neon-cyan hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Promos
          </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Promo Image */}
            {promo.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img 
                  src={promo.image_url} 
                  alt={promo.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Promo Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-3xl gradient-text">{promo.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-neon-pink text-black font-bold text-lg px-3 py-1 neon-glow">
                        {promo.discount_text}
                      </Badge>
                      {promo.category && (
                        <Badge variant="secondary">{promo.category}</Badge>
                      )}
                      {promo.promo_type && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                          {promo.promo_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{totalReviews > 0 ? averageRating.toFixed(1) : "No rating"}</span>
                      <span>•</span>
                      <span>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  <Linkify options={{ target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline" }}>
                    {promo.description}
                  </Linkify>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Venue</h4>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{promo.venue_name}</p>
                        <p className="text-sm text-muted-foreground">{promo.venue_address}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Validity</h4>
                    <div className="space-y-1">
                      {promo.day_of_week && (
                        <p className="text-sm">Every {promo.day_of_week}</p>
                      )}
                      {promo.valid_until && (
                        <p className="text-sm">Valid until {promo.valid_until}</p>
                      )}
                    </div>
                  </div>
                </div>

                {markers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Location</h4>
                    <GoogleMap
                      center={{ lat: Number(promo.venue_latitude), lng: Number(promo.venue_longitude) }}
                      markers={markers}
                      height="300px"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewsList 
                 promoId={promo.id} 
                 onReviewsChange={handleReviewsChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Promo Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="line-through text-muted-foreground">
                      {promo.original_price_amount ? `${promo.price_currency} ${promo.original_price_amount.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Your Price</span>
                    <span className="font-bold text-neon-pink text-xl">
                      {promo.discounted_price_amount ? `${promo.price_currency} ${promo.discounted_price_amount.toLocaleString()}` : 'FREE'}
                    </span>
                  </div>
                </div>

                {promo.area && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Area</span>
                    <Badge variant="outline">{promo.area}</Badge>
                  </div>
                )}

                {promo.drink_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Drink Type</span>
                    <Badge variant="outline">{promo.drink_type}</Badge>
                  </div>
                )}

                <Button
                  onClick={handleClaimPromo}
                  className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold"
                >
                  Claim Promo
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link Copied!",
                      description: "Promo link copied to clipboard.",
                    });
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Promo
                </Button>
                
                <ReportDialog
                  type="promo"
                  targetId={promo.id}
                  targetTitle={promo.title}
                />
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};