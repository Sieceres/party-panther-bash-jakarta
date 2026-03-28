import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowLeft, Star, Share2, User as UserIcon, BadgeCheck, Pencil, Ticket, Loader2 } from "lucide-react";
import { VoucherDisplay } from "./VoucherDisplay";
import { GoogleMap } from "./GoogleMap";
import { ReviewsList } from "./ReviewsList";
import { ReportDialog } from "./ReportDialog";
import { SpinningPaws } from "./ui/spinning-paws";
import { Header } from "./Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPromoBySlugOrId } from "@/lib/slug-utils";
import { checkUserAdminStatus } from "@/lib/auth-helpers";
import Linkify from "linkify-react";
import { usePageTitle } from "@/hooks/usePageTitle";

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
  day_of_week: string | string[];
  category: string;
  promo_type: string;
  image_url: string;
  area: string;
  drink_type: string;
  created_at: string;
  created_by: string;
  venue_id: string | null;
}

export const PromoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [venueOwnerId, setVenueOwnerId] = useState<string | null>(null);
  const [claimedVoucher, setClaimedVoucher] = useState<any>(null);
  const [claimingVoucher, setClaimingVoucher] = useState(false);

  usePageTitle(promo?.title ? `${promo.title}` : "Promo");

  useEffect(() => {
    const fetchUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const adminStatus = await checkUserAdminStatus(user.id);
        setIsAdmin(adminStatus.is_admin);
      }
    };
    fetchUserStatus();
  }, []);

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

        // Fetch creator profile
        if (data.created_by) {
          const { data: creatorProfileData } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, is_verified, venue_status, business_name')
            .eq('user_id', data.created_by)
            .single();
          
          setCreatorProfile(creatorProfileData);
        }

        // Fetch venue owner if promo has a venue_id
        if (data.venue_id) {
          const { data: venueData } = await supabase
            .from('venues')
            .select('claimed_by')
            .eq('id', data.venue_id)
            .eq('claim_status', 'approved')
            .single();
          if (venueData?.claimed_by) setVenueOwnerId(venueData.claimed_by);
        }
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

  // Check if user already has a voucher for this promo
  useEffect(() => {
    if (!currentUserId || !promo?.id) return;
    supabase
      .from("promo_vouchers")
      .select("*")
      .eq("promo_id", promo.id)
      .eq("user_id", currentUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setClaimedVoucher(data);
      });
  }, [currentUserId, promo?.id]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleClaimVoucher = async () => {
    if (!promo || !currentUserId) {
      toast({ title: "Please log in", description: "You need to be logged in to claim a voucher.", variant: "destructive" });
      return;
    }
    setClaimingVoucher(true);
    try {
      const code = generateCode();
      const { data, error } = await supabase.from("promo_vouchers").insert({
        promo_id: promo.id,
        user_id: currentUserId,
        code,
        redemption_mode: (promo as any).voucher_mode || "single",
        cooldown_days: (promo as any).voucher_cooldown_days || null,
        expires_at: promo.valid_until ? new Date(promo.valid_until).toISOString() : null,
      }).select().single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation on code, retry once
          const retryCode = generateCode();
          const { data: retryData, error: retryErr } = await supabase.from("promo_vouchers").insert({
            promo_id: promo.id,
            user_id: currentUserId,
            code: retryCode,
            redemption_mode: (promo as any).voucher_mode || "single",
            cooldown_days: (promo as any).voucher_cooldown_days || null,
            expires_at: promo.valid_until ? new Date(promo.valid_until).toISOString() : null,
          }).select().single();
          if (retryErr) throw retryErr;
          setClaimedVoucher(retryData);
        } else {
          throw error;
        }
      } else {
        setClaimedVoucher(data);
      }
      toast({ title: "Voucher claimed! 🎫", description: "Show the QR code at the venue to redeem.", duration: 3000 });
    } catch (err: any) {
      console.error("Claim error:", err);
      toast({ title: "Error", description: err.message || "Failed to claim voucher", variant: "destructive" });
    } finally {
      setClaimingVoucher(false);
    }
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
      <Header activeSection="promos" />
      <div className="min-h-screen bg-background pt-20 px-4 pb-24 lg:pb-4">
        <div className="container mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/promos')}
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
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
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

            {/* Claim Button - prominent placement */}
            <div className="md:hidden">
              {claimedVoucher ? (
                <div id="mobile-claimed-voucher">
                  <VoucherDisplay
                    code={claimedVoucher.code}
                    promoTitle={promo.title}
                    redemptionMode={claimedVoucher.redemption_mode}
                    isRedeemed={claimedVoucher.is_redeemed}
                    redemptionCount={claimedVoucher.redemption_count}
                    lastRedeemedAt={claimedVoucher.last_redeemed_at}
                    cooldownDays={claimedVoucher.cooldown_days}
                    expiresAt={claimedVoucher.expires_at}
                  />
                </div>
              ) : !currentUserId ? (
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold min-h-[48px] text-base"
                >
                  <Ticket className="w-5 h-5 mr-2" /> Log in to claim voucher
                </Button>
              ) : (promo as any).voucher_enabled ? (
                <Button
                  onClick={handleClaimVoucher}
                  disabled={claimingVoucher}
                  className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold min-h-[48px] text-base"
                >
                  {claimingVoucher ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
                  ) : (
                    <><Ticket className="w-5 h-5 mr-2" /> Claim Voucher</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => toast({ title: "Promo noted! 🎊", description: `Show "${promo.title}" at the venue.`, duration: 3000 })}
                  className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold min-h-[48px] text-base"
                >
                  <Ticket className="w-5 h-5 mr-2" /> Claim Promo
                </Button>
              )}
            </div>

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
                        <p 
                          className="font-medium break-words cursor-pointer hover:text-primary transition-colors" 
                          style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1rem)' }}
                          onClick={() => navigate(`/venue/${encodeURIComponent(promo.venue_name)}`)}
                        >
                          {promo.venue_name}
                        </p>
                        <p className="text-muted-foreground break-words" style={{ fontSize: 'clamp(0.813rem, 1.1vw, 0.875rem)' }}>{promo.venue_address}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold" style={{ fontSize: 'clamp(0.938rem, 1.5vw, 1.125rem)' }}>Validity</h4>
                    <div className="space-y-1">
                      {promo.day_of_week && (
                        <p style={{ fontSize: 'clamp(0.813rem, 1.1vw, 0.875rem)' }}>
                          Every {Array.isArray(promo.day_of_week) ? promo.day_of_week.join(', ') : promo.day_of_week}
                        </p>
                      )}
                      {promo.valid_until && (
                        <p style={{ fontSize: 'clamp(0.813rem, 1.1vw, 0.875rem)' }}>Valid until {promo.valid_until}</p>
                      )}
                    </div>
                  </div>

                  {creatorProfile && (
                    <div className="space-y-2">
                      <h4 className="font-semibold" style={{ fontSize: 'clamp(0.938rem, 1.5vw, 1.125rem)' }}>Posted by</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <UserIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span style={{ fontSize: 'clamp(0.813rem, 1.1vw, 0.875rem)' }}>
                          {creatorProfile.display_name || 'Party Panther Admin'}
                        </span>
                        {creatorProfile.venue_status === 'verified' && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            Verified Venue
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
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
                 venueOwnerId={venueOwnerId}
                 onReviewsChange={handleReviewsChange}
                />
              </CardContent>
            </Card>

            <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 border border-border text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <span className="text-base mt-0.5">ℹ️</span>
              <p>We gather promo info straight from the venue social media, but deals can change fast. Double‑check with the venue before heading out, and please report if anything is incorrect.</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Promo Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {claimedVoucher ? (
                  <VoucherDisplay
                    code={claimedVoucher.code}
                    promoTitle={promo.title}
                    redemptionMode={claimedVoucher.redemption_mode}
                    isRedeemed={claimedVoucher.is_redeemed}
                    redemptionCount={claimedVoucher.redemption_count}
                    lastRedeemedAt={claimedVoucher.last_redeemed_at}
                    cooldownDays={claimedVoucher.cooldown_days}
                    expiresAt={claimedVoucher.expires_at}
                  />
                ) : !currentUserId ? (
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold min-h-[44px]"
                    style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
                  >
                    <Ticket className="w-4 h-4 mr-2" /> Log in to claim voucher
                  </Button>
                ) : (promo as any).voucher_enabled ? (
                  <Button
                    onClick={handleClaimVoucher}
                    disabled={claimingVoucher}
                    className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold min-h-[44px]"
                    style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
                  >
                    {claimingVoucher ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
                    ) : (
                      <><Ticket className="w-4 h-4 mr-2" /> Claim Voucher</>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => toast({ title: "Promo noted! 🎊", description: `Show "${promo.title}" at the venue.`, duration: 3000 })}
                    className="w-full bg-neon-pink hover:bg-neon-pink/90 text-black font-semibold min-h-[44px]"
                    style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
                  >
                    Claim Promo
                  </Button>
                )}
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
                
                {(currentUserId === promo.created_by || isAdmin) ? (
                  <Button
                    onClick={() => navigate(`/edit-promo/${promo.id}`)}
                    className="w-full min-h-[44px]"
                    style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Promo
                  </Button>
                ) : (
                  <ReportDialog
                    type="promo"
                    targetId={promo.id}
                    targetTitle={promo.title}
                  />
                )}
              </CardContent>
            </Card>
          </div>
          </div>
        </div>

        {/* Mobile sticky claim CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 lg:hidden">
          {claimedVoucher ? (
            <Button
              onClick={() => {
                const voucherSection = document.getElementById('mobile-claimed-voucher');
                voucherSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[48px]"
            >
              <Ticket className="w-5 h-5 mr-2" /> View My Voucher
            </Button>
          ) : !currentUserId ? (
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[48px]"
            >
              <Ticket className="w-5 h-5 mr-2" /> Log in to claim voucher
            </Button>
          ) : (promo as any).voucher_enabled ? (
            <Button
              onClick={handleClaimVoucher}
              disabled={claimingVoucher}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[48px]"
            >
              {claimingVoucher ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
              ) : (
                <><Ticket className="w-5 h-5 mr-2" /> Claim Voucher</>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => toast({ title: "Promo noted! 🎊", description: `Show "${promo.title}" at the venue.`, duration: 3000 })}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[48px]"
            >
              <Ticket className="w-5 h-5 mr-2" /> Claim Promo
            </Button>
          )}
        </div>
      </div>
    </>
  );
};