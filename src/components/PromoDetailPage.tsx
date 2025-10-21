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
            {/* Title and Badges - Above Image */}
            <div className="space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <h1 className="gradient-text leading-tight break-words" style={{ fontSize: 'clamp(1.5rem, 4vw + 0.5rem, 2.5rem)' }}>
                    {promo.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-bold px-3 py-1.5" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>
                      {promo.discount_text}
                    </Badge>
                    {promo.promo_type && 
                      promo.promo_type.toLowerCase().replace(/[\s-]+/g, '') !== 
                      promo.discount_text.toLowerCase().replace(/[\s-]+/g, '') && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                        {promo.promo_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 'clamp(0.813rem, 1.2vw, 0.875rem)' }}>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{totalReviews > 0 ? averageRating.toFixed(1) : "No rating"}</span>
                  <span>•</span>
                  <span>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
                </div>
              </div>
            </div>

            {/* Promo Image */}
            {promo.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img 
                  src={promo.image_url} 
                  alt={promo.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}

            {/* Promo Details */}
            <Card>
              <CardHeader>
                <CardTitle>About This Promo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words" style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}>
                  <Linkify options={{ target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline" }}>
                    {promo.description}
                  </Linkify>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold" style={{ fontSize: 'clamp(0.938rem, 1.5vw, 1.125rem)' }}>Venue</h4>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium break-words" style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}>{promo.venue_name}</p>
                        <p className="text-muted-foreground break-words" style={{ fontSize: 'clamp(0.813rem, 1.1vw, 0.875rem)' }}>{promo.venue_address}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold" style={{ fontSize: 'clamp(0.938rem, 1.5vw, 1.125rem)' }}>Validity</h4>
                    <div className="space-y-1">
                      {promo.day_of_week && (
                        <p style={{ fontSize: 'clamp(0.813rem, 1.1vw, 0.875rem)' }}>Every {promo.day_of_week}</p>
                      )}
                      {promo.valid_until && (
                        <p style={{ fontSize: 'clamp(0.813rem, 1.1vw, 0.875rem)' }}>Valid until {promo.valid_until}</p>
                      )}
                    </div>
                  </div>
                </div>

                {markers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold" style={{ fontSize: 'clamp(0.938rem, 1.5vw, 1.125rem)' }}>Location</h4>
                    <div className="rounded-lg overflow-hidden">
                      <GoogleMap
                        center={{ lat: Number(promo.venue_latitude), lng: Number(promo.venue_longitude) }}
                        markers={markers}
                        height="300px"
                      />
                    </div>
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground" style={{ fontSize: 'clamp(0.813rem, 1.2vw, 0.875rem)' }}>Original Price</span>
                    <span className="line-through text-muted-foreground" style={{ fontSize: 'clamp(0.813rem, 1.2vw, 0.875rem)' }}>
                      {promo.original_price_amount ? `${promo.price_currency} ${promo.original_price_amount.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold" style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}>Your Price</span>
                    <span className="font-bold text-neon-pink" style={{ fontSize: 'clamp(1.25rem, 2vw, 1.5rem)' }}>
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
                  className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold min-h-[44px]"
                  style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
                >
                  Claim Promo
                </Button>
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
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