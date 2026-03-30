import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowLeft, Clock, Globe, Phone, Instagram, Store, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import { SpinningPaws } from "./ui/spinning-paws";
import { Header } from "./Header";
import { PromoCard } from "./PromoCard";
import { EventCard } from "./EventCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVenueBySlugOrId } from "@/lib/slug-utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Helmet } from "react-helmet-async";
import { VenueEditDialog } from "./VenueEditDialog";
import { VenuePinSetup } from "./VenuePinSetup";
import { getRegionLabelForArea } from "@/lib/area-config";

interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  instagram: string | null;
  whatsapp: string | null;
  website: string | null;
  opening_hours: string | null;
  image_url: string | null;
  google_maps_link: string | null;
  claimed_by: string | null;
  claim_status: string;
  created_at: string;
  area: string | null;
}

const truncateAddress = (address: string) => {
  const parts = address.split(",");
  if (parts.length <= 2) return address;
  const cityPatterns = /jakarta|indonesia|dki|java|\d{5}/i;
  const truncated: string[] = [];
  for (const part of parts) {
    if (cityPatterns.test(part.trim())) break;
    truncated.push(part.trim());
  }
  return truncated.length > 0 ? truncated.join(", ") : parts.slice(0, 2).join(", ");
};

export const VenueDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fetchKey, setFetchKey] = useState(0);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePromos, setDeletePromos] = useState(false);
  const [deleteEvents, setDeleteEvents] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [existingClaim, setExistingClaim] = useState<string | null>(null);

  const handleDeleteVenue = async () => {
    if (!venue?.id) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
        return;
      }

      const res = await supabase.functions.invoke("secure-delete", {
        body: {
          venue_id: venue.id,
          type: "venue",
          delete_promos: deletePromos,
          delete_events: deleteEvents,
        },
      });

      if (res.error || !res.data?.success) {
        throw new Error(res.data?.error || res.error?.message || "Delete failed");
      }

      toast({ title: "Venue deleted successfully" });
      navigate("/venues");
    } catch (error: any) {
      console.error("Error deleting venue:", error);
      toast({ title: "Error", description: error.message || "Failed to delete venue", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUserId(user.id);
        supabase.from("user_roles").select("role").eq("user_id", user.id)
          .then(({ data }) => {
            setIsAdmin(data?.some(r => r.role === "admin" || r.role === "superadmin") || false);
          });
      }
    });
  }, []);

  // Check if user already has a pending claim for this venue
  useEffect(() => {
    if (!currentUserId || !venue?.id) return;
    supabase
      .from("venue_claims")
      .select("status")
      .eq("venue_id", venue.id)
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setExistingClaim(data?.[0]?.status || null);
      });
  }, [currentUserId, venue?.id]);

  const handleClaimSubmit = async () => {
    if (!venue?.id || !currentUserId) return;
    setSubmittingClaim(true);
    try {
      const { error } = await supabase.from("venue_claims").insert({
        venue_id: venue.id,
        user_id: currentUserId,
        message: claimMessage.trim(),
      });
      if (error) throw error;
      // Notify admin (fire-and-forget)
      supabase.functions.invoke('notify-admin', {
        body: {
          type: 'new_venue_claim',
          title: venue.name,
          details: { Message: claimMessage.trim() || 'No message' },
          link: `/venue/${venue.slug || venue.id}`,
        }
      }).catch(err => console.error('Notify failed:', err));
      toast({ title: "Claim submitted", description: "An admin will review your claim." });
      setShowClaimDialog(false);
      setClaimMessage("");
      setExistingClaim("pending");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingClaim(false);
    }
  };

  usePageTitle(venue?.name ? `${venue.name}` : "Venue");

  useEffect(() => {
    const fetchVenue = async () => {
      if (!id) return;
      try {
        // Try slug/id first, then fall back to name match
        let { data, error } = await getVenueBySlugOrId(id);
        
        if (!data) {
          // Try by name (for when clicking venue name before venue is seeded)
          const { data: venueByName } = await supabase
            .from("venues")
            .select("*")
            .ilike("name", decodeURIComponent(id))
            .maybeSingle();
          data = venueByName;
        }
        
        if (!data) {
          // No venue record exists yet - show a basic page from promo/event data
          const decodedName = decodeURIComponent(id);
          const { data: matchingPromos } = await supabase
            .from("promos")
            .select("*")
            .ilike("venue_name", decodedName)
            .order("created_at", { ascending: false });
          const { data: matchingEvents } = await supabase
            .from("events")
            .select("*")
            .ilike("venue_name", decodedName)
            .order("date", { ascending: true });
          
          if ((matchingPromos && matchingPromos.length > 0) || (matchingEvents && matchingEvents.length > 0)) {
            const firstItem = matchingPromos?.[0] || matchingEvents?.[0];
            setVenue({
              id: "",
              name: firstItem.venue_name || decodedName,
              slug: "",
              address: firstItem.venue_address,
              latitude: firstItem.venue_latitude,
              longitude: firstItem.venue_longitude,
              description: null,
              instagram: null,
              whatsapp: null,
              website: null,
              opening_hours: null,
              image_url: null,
              claimed_by: null,
              claim_status: "unclaimed",
              created_at: "",
              area: null,
            } as Venue);
            setPromos(matchingPromos || []);
            setEvents(matchingEvents || []);
            setLoading(false);
            return;
          }
          throw new Error("Venue not found");
        }
        
        setVenue(data as any);

        // Fetch promos linked to this venue (by venue_id or venue_name match)
        const { data: venuePromos } = await supabase
          .from("promos")
          .select("*")
          .or(`venue_id.eq.${data.id},venue_name.ilike.${data.name}`)
          .order("created_at", { ascending: false });
        setPromos(venuePromos || []);

        // Fetch events linked to this venue
        const today = new Date().toISOString().split('T')[0];
        const { data: venueEvents } = await supabase
          .from("events")
          .select("*")
          .or(`venue_id.eq.${data.id},venue_name.ilike.${data.name}`)
          .gte("date", today)
          .order("date", { ascending: true });
        setEvents(venueEvents || []);
      } catch (error) {
        console.error("Error fetching venue:", error);
        toast({ title: "Error", description: "Failed to load venue details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [id, toast, fetchKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto text-center space-y-4">
          <SpinningPaws size="lg" />
          <div>Loading venue details...</div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto text-center">Venue not found</div>
      </div>
    );
  }


  return (
    <>
      <Helmet>
        <title>{venue.name}${venue.area ? ` — ${venue.area}` : ''} — Jakarta Bar & Club | Party Panther</title>
        <meta name="description" content={`${venue.name}${venue.area ? ` in ${venue.area}` : ''}, Jakarta. ${venue.description?.slice(0, 120) || 'Discover drink promos, events and more at this Jakarta venue.'}`} />
      </Helmet>
      <Header activeSection="venues" />
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {/* Venue Header */}
          <div className="mb-8">
            {venue.image_url && (
              <div className="aspect-[3/1] rounded-lg overflow-hidden bg-muted mb-6">
                <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Store className="w-6 h-6 text-primary" />
                  <h1 className="gradient-text leading-tight" style={{ fontSize: "clamp(1.5rem, 4vw + 0.5rem, 2.5rem)" }}>
                    {venue.name}
                  </h1>
                  {isLoggedIn && venue.id && (
                    <Button size="sm" variant="ghost" onClick={() => setShowEditDialog(true)} className="text-muted-foreground hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {isAdmin && venue.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete venue?</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3">
                              <p>This will permanently delete "{venue.name}" and cannot be undone. Promos and events linked to this venue will be unlinked but not deleted.</p>
                              {promos.length > 0 && (
                                <div>
                                  <p className="font-medium text-foreground">Active promos ({promos.length}):</p>
                                  <ul className="list-disc pl-5 text-sm mt-1 space-y-0.5">
                                    {promos.slice(0, 5).map(p => <li key={p.id}>{p.title}</li>)}
                                    {promos.length > 5 && <li>…and {promos.length - 5} more</li>}
                                  </ul>
                                </div>
                              )}
                              {events.length > 0 && (
                                <div>
                                  <p className="font-medium text-foreground">Active events ({events.length}):</p>
                                  <ul className="list-disc pl-5 text-sm mt-1 space-y-0.5">
                                    {events.slice(0, 5).map(e => <li key={e.id}>{e.title}</li>)}
                                    {events.length > 5 && <li>…and {events.length - 5} more</li>}
                                  </ul>
                                </div>
                              )}
                              {promos.length > 0 && (
                                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                  <Checkbox checked={deletePromos} onCheckedChange={(v) => setDeletePromos(!!v)} />
                                  <span className="text-sm text-destructive font-medium">Also delete {promos.length} promo{promos.length !== 1 ? "s" : ""}</span>
                                </label>
                              )}
                              {events.length > 0 && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox checked={deleteEvents} onCheckedChange={(v) => setDeleteEvents(!!v)} />
                                  <span className="text-sm text-destructive font-medium">Also delete {events.length} event{events.length !== 1 ? "s" : ""}</span>
                                </label>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteVenue} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {venue.claim_status === "approved" && (
                  <Badge variant="secondary" className="text-xs">✓ Claimed Venue</Badge>
                )}
                {/* Venue PIN Setup - for venue owners and admins */}
                {venue.id && (venue.claimed_by === currentUserId || isAdmin) && (
                  <VenuePinSetup venueId={venue.id} />
                )}
                {venue.area && (
                  <Badge variant="outline" className="text-xs">
                    📍 {venue.area}{getRegionLabelForArea(venue.area) ? ` · ${getRegionLabelForArea(venue.area)}` : ""}
                  </Badge>
                )}
                {/* Claim button: show for logged-in users when venue is unclaimed and no existing claim */}
                {isLoggedIn && venue.id && venue.claim_status !== "approved" && venue.claimed_by !== currentUserId && !existingClaim && (
                  <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-xs">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Claim This Venue
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Claim {venue.name}</DialogTitle>
                        <DialogDescription>
                          Tell us why you're the owner of this venue. An admin will review your claim.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="e.g. I'm the owner, here's my Instagram @venuename..."
                        value={claimMessage}
                        onChange={(e) => setClaimMessage(e.target.value)}
                        rows={3}
                      />
                      <DialogFooter>
                        <Button onClick={handleClaimSubmit} disabled={submittingClaim || !claimMessage.trim()}>
                          {submittingClaim ? "Submitting..." : "Submit Claim"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                {existingClaim === "pending" && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Claim pending review</Badge>
                )}
                {existingClaim === "rejected" && (
                  <Badge variant="outline" className="text-xs text-destructive">Claim rejected</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {venue.description && (
                <Card>
                  <CardHeader><CardTitle>About</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{venue.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Map */}
              {venue.address && (
                <Card>
                  <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                  <CardContent>
                    <a
                      href={venue.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 mb-4 hover:text-primary transition-colors"
                      title={venue.address}
                    >
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <p className="text-muted-foreground hover:text-primary underline underline-offset-2">{truncateAddress(venue.address)}</p>
                    </a>
                    <div className="rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.address)}&output=embed`}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Promos at this venue */}
              {promos.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Promos at {venue.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promos.map((promo, i) => (
                      <PromoCard
                        key={promo.id}
                        index={i}
                        isVenueOwner={venue.claim_status === "approved" && venue.claimed_by === currentUserId}
                        promo={{
                          id: promo.id,
                          title: promo.title,
                          description: promo.description,
                          discount: promo.discount_text,
                          venue: promo.venue_name,
                          validUntil: promo.valid_until || "",
                          image: promo.image_url || "",
                          category: promo.category || "",
                          day: promo.day_of_week || [],
                          area: promo.area || "",
                          drinkType: promo.drink_type || [],
                          created_by: promo.created_by,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Events at this venue */}
              {events.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Events at {venue.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} isVenueOwner={venue.claim_status === "approved" && venue.claimed_by === currentUserId} />
                    ))}
                  </div>
                </div>
              )}

              {promos.length === 0 && events.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No promos or events at this venue yet.
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Venue Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {venue.address && (
                      <a
                        href={venue.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 hover:text-primary transition-colors"
                        title={venue.address}
                      >
                        <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground hover:text-primary underline underline-offset-2">{truncateAddress(venue.address)}</span>
                      </a>
                  )}
                  {venue.opening_hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{venue.opening_hours}</span>
                    </div>
                  )}
                  {venue.whatsapp && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <a href={`https://wa.me/${venue.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {venue.whatsapp}
                      </a>
                    </div>
                  )}
                  {venue.instagram && (
                    <div className="flex items-start gap-2">
                      <Instagram className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <a href={`https://instagram.com/${venue.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        @{venue.instagram.replace("@", "")}
                      </a>
                    </div>
                  )}
                  {venue.website && (
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <a href={venue.website.startsWith("http") ? venue.website : `https://${venue.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                        {venue.website}
                      </a>
                    </div>
                  )}

                  <Separator />

                  <div className="text-center text-sm text-muted-foreground">
                    <p>{promos.length} promo{promos.length !== 1 ? "s" : ""}</p>
                    <p>{events.length} event{events.length !== 1 ? "s" : ""}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {venue.id && (
        <VenueEditDialog
          venue={venue}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSaved={() => setFetchKey(k => k + 1)}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
};
