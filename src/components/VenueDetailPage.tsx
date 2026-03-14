import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowLeft, Clock, Globe, Phone, Instagram, Store, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleMap } from "./GoogleMap";
import { SpinningPaws } from "./ui/spinning-paws";
import { Header } from "./Header";
import { PromoCard } from "./PromoCard";
import { EventCard } from "./EventCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVenueBySlugOrId } from "@/lib/slug-utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { VenueEditDialog } from "./VenueEditDialog";

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
  claimed_by: string | null;
  claim_status: string;
  created_at: string;
}

export const VenueDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteVenue = async () => {
    if (!venue?.id) return;
    setDeleting(true);
    try {
      // Unlink related promos and events first to avoid FK constraint errors
      await supabase.from("promos").update({ venue_id: null }).eq("venue_id", venue.id);
      await supabase.from("events").update({ venue_id: null }).eq("venue_id", venue.id);
      await supabase.from("venue_edits").delete().eq("venue_id", venue.id);
      
      const { error } = await supabase.from("venues").delete().eq("id", venue.id);
      if (error) throw error;
      toast({ title: "Venue deleted successfully" });
      navigate("/venues");
    } catch (error) {
      console.error("Error deleting venue:", error);
      toast({ title: "Error", description: "Failed to delete venue", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        supabase.from("user_roles").select("role").eq("user_id", user.id)
          .then(({ data }) => {
            setIsAdmin(data?.some(r => r.role === "admin" || r.role === "superadmin") || false);
          });
      }
    });
  }, []);

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
        const { data: venueEvents } = await supabase
          .from("events")
          .select("*")
          .or(`venue_id.eq.${data.id},venue_name.ilike.${data.name}`)
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
  }, [id, toast]);

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

  const markers = venue.latitude && venue.longitude
    ? [{ lat: Number(venue.latitude), lng: Number(venue.longitude), title: venue.name }]
    : [];

  return (
    <>
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
              {markers.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                  <CardContent>
                    {venue.address && (
                      <div className="flex items-start gap-2 mb-4">
                        <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <p className="text-muted-foreground">{venue.address}</p>
                      </div>
                    )}
                    <div className="rounded-lg overflow-hidden">
                      <GoogleMap center={{ lat: Number(venue.latitude), lng: Number(venue.longitude) }} markers={markers} height="300px" />
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
                      <EventCard key={event.id} event={event} />
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
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{venue.address}</span>
                    </div>
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
          onSaved={() => window.location.reload()}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
};
