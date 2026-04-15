import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Merge, Search, ArrowRight, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface VenueRow {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  area: string | null;
  instagram: string | null;
  whatsapp: string | null;
  website: string | null;
  opening_hours: string | null;
  image_url: string | null;
  google_maps_link: string | null;
  latitude: number | null;
  longitude: number | null;
  claimed_by: string | null;
  claim_status: string;
  description: string | null;
}

interface LinkedCounts {
  promos: number;
  events: number;
}

export const AdminVenueMerge = () => {
  const [searchSource, setSearchSource] = useState("");
  const [searchTarget, setSearchTarget] = useState("");
  const [sourceResults, setSourceResults] = useState<VenueRow[]>([]);
  const [targetResults, setTargetResults] = useState<VenueRow[]>([]);
  const [sourceVenue, setSourceVenue] = useState<VenueRow | null>(null);
  const [targetVenue, setTargetVenue] = useState<VenueRow | null>(null);
  const [sourceCounts, setSourceCounts] = useState<LinkedCounts>({ promos: 0, events: 0 });
  const [targetCounts, setTargetCounts] = useState<LinkedCounts>({ promos: 0, events: 0 });
  const [showConfirm, setShowConfirm] = useState(false);
  const [merging, setMerging] = useState(false);
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, "source" | "target">>({});

  const MERGE_FIELDS = [
    { key: "address", label: "Address" },
    { key: "area", label: "Area" },
    { key: "description", label: "Description" },
    { key: "instagram", label: "Instagram" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "website", label: "Website" },
    { key: "opening_hours", label: "Opening Hours" },
    { key: "image_url", label: "Image" },
    { key: "google_maps_link", label: "Google Maps" },
    { key: "latitude", label: "Latitude" },
    { key: "longitude", label: "Longitude" },
  ] as const;

  const searchVenues = async (query: string, setter: (v: VenueRow[]) => void) => {
    if (query.length < 2) { setter([]); return; }
    const { data } = await supabase
      .from("venues")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(10);
    setter((data as VenueRow[]) || []);
  };

  const fetchCounts = async (venueId: string): Promise<LinkedCounts> => {
    const [{ count: promos }, { count: events }] = await Promise.all([
      supabase.from("promos").select("*", { count: "exact", head: true }).eq("venue_id", venueId),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("venue_id", venueId),
    ]);
    return { promos: promos || 0, events: events || 0 };
  };

  const selectVenue = async (
    venue: VenueRow,
    side: "source" | "target"
  ) => {
    const counts = await fetchCounts(venue.id);
    if (side === "source") {
      setSourceVenue(venue);
      setSourceResults([]);
      setSearchSource(venue.name);
      setSourceCounts(counts);
    } else {
      setTargetVenue(venue);
      setTargetResults([]);
      setSearchTarget(venue.name);
      setTargetCounts(counts);
    }
  };

  // Initialize field overrides when venues are selected
  useEffect(() => {
    if (sourceVenue && targetVenue) {
      const overrides: Record<string, "source" | "target"> = {};
      MERGE_FIELDS.forEach(({ key }) => {
        const sv = (sourceVenue as any)[key];
        const tv = (targetVenue as any)[key];
        // Default to target if it has a value, otherwise source
        overrides[key] = tv ? "target" : sv ? "source" : "target";
      });
      setFieldOverrides(overrides);
    }
  }, [sourceVenue, targetVenue]);

  const handleMerge = async () => {
    if (!sourceVenue || !targetVenue) return;
    if (sourceVenue.id === targetVenue.id) {
      toast.error("Cannot merge a venue with itself");
      return;
    }
    setMerging(true);
    try {
      // 1. Build update payload from field overrides
      const venueUpdate: Record<string, any> = {};
      MERGE_FIELDS.forEach(({ key }) => {
        if (fieldOverrides[key] === "source") {
          const val = (sourceVenue as any)[key];
          if (val !== null && val !== undefined) {
            venueUpdate[key] = val;
          }
        }
      });

      // If source has a claim and target doesn't, transfer it
      if (sourceVenue.claimed_by && !targetVenue.claimed_by) {
        venueUpdate.claimed_by = sourceVenue.claimed_by;
        venueUpdate.claim_status = sourceVenue.claim_status;
      }

      // 2. Update target venue with merged fields
      if (Object.keys(venueUpdate).length > 0) {
        const { error } = await supabase
          .from("venues")
          .update(venueUpdate)
          .eq("id", targetVenue.id);
        if (error) throw error;
      }

      // 3. Move all promos from source to target
      const promoSyncFields: Record<string, any> = {
        venue_id: targetVenue.id,
        venue_name: targetVenue.name,
      };
      // Use the merged values for address/coords
      const finalAddress = fieldOverrides.address === "source" ? sourceVenue.address : targetVenue.address;
      const finalLat = fieldOverrides.latitude === "source" ? sourceVenue.latitude : targetVenue.latitude;
      const finalLng = fieldOverrides.longitude === "source" ? sourceVenue.longitude : targetVenue.longitude;
      if (finalAddress) promoSyncFields.venue_address = finalAddress;
      if (finalLat) promoSyncFields.venue_latitude = finalLat;
      if (finalLng) promoSyncFields.venue_longitude = finalLng;

      const { error: promoErr } = await supabase
        .from("promos")
        .update(promoSyncFields)
        .eq("venue_id", sourceVenue.id);
      if (promoErr) throw promoErr;

      // 4. Move all events from source to target
      const eventSyncFields: Record<string, any> = {
        venue_id: targetVenue.id,
        venue_name: targetVenue.name,
      };
      if (finalAddress) eventSyncFields.venue_address = finalAddress;
      if (finalLat) eventSyncFields.venue_latitude = finalLat;
      if (finalLng) eventSyncFields.venue_longitude = finalLng;

      const { error: eventErr } = await supabase
        .from("events")
        .update(eventSyncFields)
        .eq("venue_id", sourceVenue.id);
      if (eventErr) throw eventErr;

      // 5. Move venue claims from source to target
      await supabase
        .from("venue_claims")
        .update({ venue_id: targetVenue.id })
        .eq("venue_id", sourceVenue.id);

      // 6. Move venue edits from source to target
      await supabase
        .from("venue_edits")
        .update({ venue_id: targetVenue.id })
        .eq("venue_id", sourceVenue.id);

      // 7. Move venue pins from source to target
      // First check if target already has a pin
      const { data: existingPin } = await supabase
        .from("venue_pins")
        .select("id")
        .eq("venue_id", targetVenue.id)
        .maybeSingle();
      
      if (!existingPin) {
        await supabase
          .from("venue_pins")
          .update({ venue_id: targetVenue.id })
          .eq("venue_id", sourceVenue.id);
      }

      // 8. Delete the source venue
      const authData = JSON.parse(localStorage.getItem('sb-qgttbaibhmzbmknjlghj-auth-token') || '{}');
      const response = await fetch('https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/secure-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ venue_id: sourceVenue.id })
      });
      const deleteResult = await response.json();
      if (!deleteResult.success) {
        console.warn("Source venue deletion warning:", deleteResult);
      }

      toast.success(`Merged "${sourceVenue.name}" into "${targetVenue.name}" — ${sourceCounts.promos} promos and ${sourceCounts.events} events moved`);

      // Reset state
      setSourceVenue(null);
      setTargetVenue(null);
      setSearchSource("");
      setSearchTarget("");
      setShowConfirm(false);
    } catch (error: any) {
      console.error("Merge failed:", error);
      toast.error(`Merge failed: ${error.message}`);
    } finally {
      setMerging(false);
    }
  };

  const getFieldValue = (venue: VenueRow | null, key: string) => {
    if (!venue) return "—";
    const val = (venue as any)[key];
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "number") return val.toFixed(6);
    return String(val).length > 40 ? String(val).substring(0, 40) + "…" : String(val);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Merge Duplicate Venues
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a source venue (to be removed) and a target venue (to keep). All promos and events will be moved to the target.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Venue */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-destructive">Source (will be deleted)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search venue to merge from..."
                  value={searchSource}
                  onChange={(e) => {
                    setSearchSource(e.target.value);
                    searchVenues(e.target.value, setSourceResults);
                    if (sourceVenue) setSourceVenue(null);
                  }}
                  className="pl-9"
                />
              </div>
              {sourceResults.length > 0 && !sourceVenue && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {sourceResults.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => selectVenue(v, "source")}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-b-0"
                    >
                      <span className="font-medium">{v.name}</span>
                      {v.area && <span className="text-muted-foreground ml-2">({v.area})</span>}
                    </button>
                  ))}
                </div>
              )}
              {sourceVenue && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="pt-4 text-sm space-y-1">
                    <p className="font-semibold">{sourceVenue.name}</p>
                    <p className="text-muted-foreground">{sourceVenue.address || "No address"}</p>
                    <p className="text-muted-foreground">{sourceVenue.area || "No area"}</p>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="outline">{sourceCounts.promos} promos</Badge>
                      <Badge variant="outline">{sourceCounts.events} events</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Target Venue */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-primary">Target (will be kept)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search venue to merge into..."
                  value={searchTarget}
                  onChange={(e) => {
                    setSearchTarget(e.target.value);
                    searchVenues(e.target.value, setTargetResults);
                    if (targetVenue) setTargetVenue(null);
                  }}
                  className="pl-9"
                />
              </div>
              {targetResults.length > 0 && !targetVenue && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {targetResults.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => selectVenue(v, "target")}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-b-0"
                    >
                      <span className="font-medium">{v.name}</span>
                      {v.area && <span className="text-muted-foreground ml-2">({v.area})</span>}
                    </button>
                  ))}
                </div>
              )}
              {targetVenue && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4 text-sm space-y-1">
                    <p className="font-semibold">{targetVenue.name}</p>
                    <p className="text-muted-foreground">{targetVenue.address || "No address"}</p>
                    <p className="text-muted-foreground">{targetVenue.area || "No area"}</p>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="outline">{targetCounts.promos} promos</Badge>
                      <Badge variant="outline">{targetCounts.events} events</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {sourceVenue && targetVenue && sourceVenue.id !== targetVenue.id && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setShowConfirm(true)} size="lg">
                <Merge className="w-4 h-4 mr-2" />
                Review & Merge
              </Button>
            </div>
          )}

          {sourceVenue && targetVenue && sourceVenue.id === targetVenue.id && (
            <p className="text-center text-destructive mt-4 text-sm">Cannot merge a venue with itself.</p>
          )}
        </CardContent>
      </Card>

      {/* Merge Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Venue Merge
            </DialogTitle>
            <DialogDescription>
              <strong>{sourceVenue?.name}</strong> will be deleted. All {sourceCounts.promos} promos and {sourceCounts.events} events will be moved to <strong>{targetVenue?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-medium">Choose which data to keep for each field:</p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2">Field</th>
                    <th className="text-left px-3 py-2 text-destructive">Source</th>
                    <th className="text-left px-3 py-2 text-primary">Target</th>
                    <th className="px-3 py-2">Keep</th>
                  </tr>
                </thead>
                <tbody>
                  {MERGE_FIELDS.map(({ key, label }) => (
                    <tr key={key} className="border-t">
                      <td className="px-3 py-2 font-medium">{label}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-[150px] truncate">
                        {getFieldValue(sourceVenue, key)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-[150px] truncate">
                        {getFieldValue(targetVenue, key)}
                      </td>
                      <td className="px-3 py-2">
                        <RadioGroup
                          value={fieldOverrides[key] || "target"}
                          onValueChange={(val) =>
                            setFieldOverrides((prev) => ({ ...prev, [key]: val as "source" | "target" }))
                          }
                          className="flex gap-3"
                        >
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="source" id={`${key}-src`} />
                            <Label htmlFor={`${key}-src`} className="text-xs">S</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="target" id={`${key}-tgt`} />
                            <Label htmlFor={`${key}-tgt`} className="text-xs">T</Label>
                          </div>
                        </RadioGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMerge} disabled={merging}>
              {merging ? "Merging..." : `Merge & Delete "${sourceVenue?.name}"`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
