import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, MessageSquare, ExternalLink } from "lucide-react";
import { ContactLogManager } from "./ContactLogManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VenueProfile {
  user_id: string;
  display_name: string;
  business_name: string | null;
  venue_whatsapp: string | null;
  venue_address: string | null;
  venue_opening_hours: string | null;
  venue_status: string;
  venue_applied_at: string | null;
  venue_verified_at: string | null;
  email?: string;
}

export const AdminVenueManagement = () => {
  const [pendingVenues, setPendingVenues] = useState<VenueProfile[]>([]);
  const [verifiedVenues, setVerifiedVenues] = useState<VenueProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<VenueProfile | null>(null);
  const [showContactLog, setShowContactLog] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("venue_status", ["pending", "verified"])
        .order("venue_applied_at", { ascending: false });

      if (error) throw error;

      const pending = profiles?.filter((p) => p.venue_status === "pending") || [];
      const verified = profiles?.filter((p) => p.venue_status === "verified") || [];

      setPendingVenues(pending);
      setVerifiedVenues(verified);
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVenue = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          venue_status: "verified",
          venue_verified_at: new Date().toISOString(),
          venue_verified_by: user.id,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Venue verified successfully");
      fetchVenues();
    } catch (error) {
      console.error("Error verifying venue:", error);
      toast.error("Failed to verify venue");
    }
  };

  const handleRejectVenue = async (userId: string) => {
    if (!confirm("Are you sure you want to reject this venue application?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          venue_status: "rejected",
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Venue application rejected");
      fetchVenues();
    } catch (error) {
      console.error("Error rejecting venue:", error);
      toast.error("Failed to reject venue");
    }
  };

  const openContactLog = (venue: VenueProfile) => {
    setSelectedVenue(venue);
    setShowContactLog(true);
  };

  const VenueCard = ({ venue, isPending }: { venue: VenueProfile; isPending: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{venue.business_name || venue.display_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Applied: {venue.venue_applied_at ? new Date(venue.venue_applied_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <Badge variant={isPending ? "secondary" : "default"}>
            {venue.venue_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Contact Name:</span>
            <p className="text-muted-foreground">{venue.display_name}</p>
          </div>
          <div>
            <span className="font-medium">WhatsApp:</span>
            <p className="text-muted-foreground">{venue.venue_whatsapp || "Not provided"}</p>
          </div>
          <div className="col-span-2">
            <span className="font-medium">Address:</span>
            <p className="text-muted-foreground">{venue.venue_address || "Not provided"}</p>
          </div>
          <div className="col-span-2">
            <span className="font-medium">Opening Hours:</span>
            <p className="text-muted-foreground">{venue.venue_opening_hours || "Not provided"}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {isPending && (
            <>
              <Button
                size="sm"
                onClick={() => handleVerifyVenue(venue.user_id)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Verify
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRejectVenue(venue.user_id)}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => openContactLog(venue)}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Contact Log
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/profile/${venue.user_id}`, "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="text-center py-8">Loading venues...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        {/* Pending Venues Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Pending Venue Applications ({pendingVenues.length})
          </h3>
          {pendingVenues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 border rounded-lg">
              No pending venue applications
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingVenues.map((venue) => (
                <VenueCard key={venue.user_id} venue={venue} isPending={true} />
              ))}
            </div>
          )}
        </div>

        {/* Verified Venues Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Verified Venues ({verifiedVenues.length})
          </h3>
          {verifiedVenues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 border rounded-lg">
              No verified venues yet
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {verifiedVenues.map((venue) => (
                <VenueCard key={venue.user_id} venue={venue} isPending={false} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Log Dialog */}
      <Dialog open={showContactLog} onOpenChange={setShowContactLog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact History</DialogTitle>
          </DialogHeader>
          {selectedVenue && (
            <ContactLogManager
              contactId={selectedVenue.user_id}
              contactName={selectedVenue.business_name || selectedVenue.display_name}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
