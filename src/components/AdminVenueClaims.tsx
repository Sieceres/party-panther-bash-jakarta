import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Store, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpinningPaws } from "@/components/ui/spinning-paws";

interface VenueClaim {
  id: string;
  venue_id: string;
  user_id: string;
  message: string;
  status: string;
  review_note: string | null;
  created_at: string;
  venue_name?: string;
  claimant_name?: string;
  claimant_email?: string;
}

export const AdminVenueClaims = () => {
  const { toast } = useToast();
  const [claims, setClaims] = useState<VenueClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("venue_claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load claims", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Enrich with venue name and claimant info
    const enriched = await Promise.all(
      (data || []).map(async (claim: any) => {
        const { data: venue } = await supabase
          .from("venues")
          .select("name")
          .eq("id", claim.venue_id)
          .maybeSingle();

        const { data: profile } = await supabase
          .rpc("get_safe_profile_info", { profile_user_id: claim.user_id });

        return {
          ...claim,
          venue_name: venue?.name || "Unknown venue",
          claimant_name: profile?.[0]?.display_name || "Unknown user",
        } as VenueClaim;
      })
    );

    setClaims(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleAction = async (claim: VenueClaim, action: "approved" | "rejected") => {
    setProcessing(claim.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update claim status
      const { error: claimError } = await supabase
        .from("venue_claims")
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNotes[claim.id] || null,
        })
        .eq("id", claim.id);

      if (claimError) throw claimError;

      // If approved, update the venue
      if (action === "approved") {
        const { error: venueError } = await supabase
          .from("venues")
          .update({
            claimed_by: claim.user_id,
            claim_status: "approved",
          })
          .eq("id", claim.venue_id);

        if (venueError) throw venueError;
      }

      toast({ title: `Claim ${action}` });
      fetchClaims();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <SpinningPaws size="md" />
      </div>
    );
  }

  const pendingClaims = claims.filter(c => c.status === "pending");
  const resolvedClaims = claims.filter(c => c.status !== "pending");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Pending Claims ({pendingClaims.length})</h3>
      {pendingClaims.length === 0 && (
        <p className="text-sm text-muted-foreground">No pending venue claims.</p>
      )}
      {pendingClaims.map((claim) => (
        <Card key={claim.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{claim.venue_name}</CardTitle>
              </div>
              <Badge variant="secondary">pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{claim.claimant_name}</span>
              <span className="text-xs">• {new Date(claim.created_at).toLocaleDateString()}</span>
            </div>
            {claim.message && (
              <p className="text-sm bg-muted/50 rounded-md p-3 border">{claim.message}</p>
            )}
            <Textarea
              placeholder="Admin note (optional)..."
              value={reviewNotes[claim.id] || ""}
              onChange={(e) => setReviewNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
              className="text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAction(claim, "approved")}
                disabled={processing === claim.id}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction(claim, "rejected")}
                disabled={processing === claim.id}
              >
                <X className="w-3 h-3 mr-1" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {resolvedClaims.length > 0 && (
        <>
          <h3 className="text-lg font-semibold pt-4">Resolved ({resolvedClaims.length})</h3>
          {resolvedClaims.map((claim) => (
            <Card key={claim.id} className="opacity-70">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Store className="w-3 h-3" />
                    <span className="font-medium">{claim.venue_name}</span>
                    <span className="text-muted-foreground">by {claim.claimant_name}</span>
                  </div>
                  <Badge variant={claim.status === "approved" ? "default" : "destructive"}>
                    {claim.status}
                  </Badge>
                </div>
                {claim.review_note && (
                  <p className="text-xs text-muted-foreground mt-2">Note: {claim.review_note}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};
