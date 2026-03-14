import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, History, ChevronDown, ChevronUp } from "lucide-react";

interface VenueEdit {
  id: string;
  venue_id: string;
  submitted_by: string;
  status: string;
  changes: Record<string, any>;
  previous_values: Record<string, any>;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  venue_name?: string;
  submitter_name?: string;
}

export function AdminVenueEdits() {
  const [pendingEdits, setPendingEdits] = useState<VenueEdit[]>([]);
  const [historyEdits, setHistoryEdits] = useState<VenueEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchEdits();
  }, []);

  const fetchEdits = async () => {
    try {
      const { data, error } = await supabase
        .from("venue_edits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with venue names and submitter names
      const venueIds = [...new Set(data?.map(e => e.venue_id) || [])];
      const userIds = [...new Set(data?.map(e => e.submitted_by) || [])];

      const [venuesRes, profilesRes] = await Promise.all([
        venueIds.length > 0
          ? supabase.from("venues").select("id, name").in("id", venueIds)
          : { data: [] },
        userIds.length > 0
          ? supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
          : { data: [] },
      ]);

      const venueMap = new Map((venuesRes.data || []).map(v => [v.id, v.name]));
      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.display_name]));

      const enriched = (data || []).map(e => ({
        ...e,
        venue_name: venueMap.get(e.venue_id) || "Unknown",
        submitter_name: profileMap.get(e.submitted_by) || "Unknown",
      }));

      setPendingEdits(enriched.filter(e => e.status === "pending"));
      setHistoryEdits(enriched.filter(e => e.status !== "pending"));
    } catch (error) {
      console.error("Error fetching venue edits:", error);
      toast.error("Failed to load venue edits");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (edit: VenueEdit) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Apply changes to venue
      const { error: venueError } = await supabase
        .from("venues")
        .update(edit.changes)
        .eq("id", edit.venue_id);
      if (venueError) throw venueError;

      // Sync lat/lng/address to linked records
      const syncFields: Record<string, any> = {};
      if ("latitude" in edit.changes) syncFields.venue_latitude = edit.changes.latitude;
      if ("longitude" in edit.changes) syncFields.venue_longitude = edit.changes.longitude;
      if ("address" in edit.changes) syncFields.venue_address = edit.changes.address;
      if (Object.keys(syncFields).length > 0) {
        await Promise.all([
          supabase.from("promos").update(syncFields).eq("venue_id", edit.venue_id),
          supabase.from("events").update(syncFields).eq("venue_id", edit.venue_id),
        ]);
      }

      // Mark as approved
      await supabase.from("venue_edits").update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", edit.id);

      toast.success("Edit approved and applied");
      fetchEdits();
    } catch (error: any) {
      console.error("Error approving edit:", error);
      toast.error("Failed to approve edit");
    }
  };

  const handleReject = async (edit: VenueEdit, note?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("venue_edits").update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      }).eq("id", edit.id);

      toast.success("Edit rejected");
      fetchEdits();
    } catch (error) {
      console.error("Error rejecting edit:", error);
      toast.error("Failed to reject edit");
    }
  };

  if (loading) return <div className="text-center py-8">Loading venue edits...</div>;

  return (
    <div className="space-y-6">
      {/* Pending Edits */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pending Edit Suggestions ({pendingEdits.length})
        </h3>
        {pendingEdits.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 border rounded-lg">
            No pending edit suggestions
          </p>
        ) : (
          <div className="space-y-4">
            {pendingEdits.map(edit => (
              <EditCard key={edit.id} edit={edit} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 mb-4"
        >
          <History className="w-5 h-5" />
          Edit History ({historyEdits.length})
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {showHistory && (
          <div className="space-y-3">
            {historyEdits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 border rounded-lg">
                No edit history yet
              </p>
            ) : (
              historyEdits.map(edit => (
                <HistoryCard key={edit.id} edit={edit} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditCard({
  edit,
  onApprove,
  onReject,
}: {
  edit: VenueEdit;
  onApprove: (e: VenueEdit) => void;
  onReject: (e: VenueEdit, note?: string) => void;
}) {
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const changedFields = Object.entries(edit.changes);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{edit.venue_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Suggested by {edit.submitter_name} · {new Date(edit.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary">pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {changedFields.map(([field, newValue]) => (
            <div key={field} className="text-sm border rounded p-2 bg-muted/30">
              <span className="font-medium capitalize">{field.replace(/_/g, " ")}:</span>
              <div className="flex gap-2 mt-1">
                <span className="text-destructive line-through text-xs">
                  {edit.previous_values[field]?.toString() || "(empty)"}
                </span>
                <span className="text-xs">→</span>
                <span className="text-primary text-xs font-medium">
                  {newValue?.toString() || "(empty)"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={() => onApprove(edit)} className="flex-1">
            <CheckCircle className="w-4 h-4 mr-1" /> Approve
          </Button>
          {showRejectInput ? (
            <div className="flex-1 flex gap-1">
              <Input
                placeholder="Reason (optional)"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                className="text-xs h-8"
              />
              <Button size="sm" variant="destructive" onClick={() => onReject(edit, rejectNote)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setShowRejectInput(true)} className="flex-1">
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryCard({ edit }: { edit: VenueEdit }) {
  const statusColor = {
    approved: "default" as const,
    rejected: "destructive" as const,
    direct: "secondary" as const,
  };

  const changedFields = Object.entries(edit.changes);

  return (
    <Card className="opacity-80">
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-medium text-sm">{edit.venue_name}</span>
            <p className="text-xs text-muted-foreground">
              {edit.status === "direct" ? "Direct edit" : `Suggested`} by {edit.submitter_name} · {new Date(edit.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={statusColor[edit.status as keyof typeof statusColor] || "outline"}>
            {edit.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {changedFields.map(([field]) => (
            <Badge key={field} variant="outline" className="text-xs">
              {field.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
        {edit.review_note && (
          <p className="text-xs text-muted-foreground mt-2 italic">Note: {edit.review_note}</p>
        )}
      </CardContent>
    </Card>
  );
}
