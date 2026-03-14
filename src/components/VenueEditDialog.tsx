import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  instagram: string | null;
  whatsapp: string | null;
  website: string | null;
  opening_hours: string | null;
  image_url: string | null;
  google_maps_link?: string | null;
}

interface VenueEditDialogProps {
  venue: Venue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  isAdmin: boolean;
}

const EDITABLE_FIELDS = [
  { key: "name", label: "Venue Name", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "instagram", label: "Instagram", type: "text" },
  { key: "whatsapp", label: "WhatsApp", type: "text" },
  { key: "website", label: "Website", type: "text" },
  { key: "opening_hours", label: "Opening Hours", type: "text" },
  { key: "google_maps_link", label: "Google Maps Link", type: "text" },
  { key: "image_url", label: "Image URL", type: "text" },
  { key: "latitude", label: "Latitude", type: "number" },
  { key: "longitude", label: "Longitude", type: "number" },
] as const;

export function VenueEditDialog({ venue, open, onOpenChange, onSaved, isAdmin }: VenueEditDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const data: Record<string, string> = {};
      EDITABLE_FIELDS.forEach(f => {
        data[f.key] = (venue as any)[f.key]?.toString() || "";
      });
      setFormData(data);
    }
  }, [open, venue]);

  const getChanges = () => {
    const changes: Record<string, any> = {};
    const previousValues: Record<string, any> = {};
    EDITABLE_FIELDS.forEach(f => {
      const currentVal = (venue as any)[f.key]?.toString() || "";
      const newVal = formData[f.key] || "";
      if (newVal !== currentVal) {
        changes[f.key] = f.type === "number" ? (newVal ? parseFloat(newVal) : null) : (newVal || null);
        previousValues[f.key] = (venue as any)[f.key] ?? null;
      }
    });
    return { changes, previousValues };
  };

  const handleSave = async () => {
    const { changes, previousValues } = getChanges();
    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Auto-geocode if address changed but lat/lng weren't manually updated
      if ("address" in changes && !("latitude" in changes) && !("longitude" in changes) && changes.address) {
        toast.info("Geocoding new address…");
        try {
          const { searchPlaces } = await import("@/lib/photon");
          const results = await searchPlaces(changes.address + " Jakarta");
          if (results.length > 0) {
            const [lng, lat] = results[0].geometry.coordinates;
            changes.latitude = lat;
            changes.longitude = lng;
            previousValues.latitude = venue.latitude ?? null;
            previousValues.longitude = venue.longitude ?? null;
            toast.success(`Geocoded to ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          } else {
            toast.warning("Geocoding returned no results — saving without coordinates", { duration: 5000 });
          }
        } catch (e) {
          console.warn("Auto-geocode failed:", e);
          toast.error("Geocoding failed — saving without updated coordinates", { duration: 5000 });
        }
      }

      if (isAdmin) {
        // Direct edit - apply changes immediately
        const { error } = await supabase
          .from("venues")
          .update(changes)
          .eq("id", venue.id);
        if (error) throw error;

        // Sync lat/lng/address to linked promos and events
        const syncFields: Record<string, any> = {};
        if ("latitude" in changes) syncFields.venue_latitude = changes.latitude;
        if ("longitude" in changes) syncFields.venue_longitude = changes.longitude;
        if ("address" in changes) syncFields.venue_address = changes.address;
        if (Object.keys(syncFields).length > 0) {
          await Promise.all([
            supabase.from("promos").update(syncFields).eq("venue_id", venue.id),
            supabase.from("events").update(syncFields).eq("venue_id", venue.id),
          ]);
        }

        // Log as direct edit in venue_edits
        await supabase.from("venue_edits").insert({
          venue_id: venue.id,
          submitted_by: user.id,
          status: "direct",
          changes,
          previous_values: previousValues,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        });

        toast.success("Venue updated successfully");
      } else {
        // User suggestion - create pending edit
        await supabase.from("venue_edits").insert({
          venue_id: venue.id,
          submitted_by: user.id,
          status: "pending",
          changes,
          previous_values: previousValues,
        });

        toast.success("Your edit suggestion has been submitted for admin review");
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving venue edit:", error);
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            {isAdmin ? "Edit Venue" : "Suggest Edits"}: {venue.name}
          </DialogTitle>
          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Your changes will be reviewed by an admin before being applied.
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {EDITABLE_FIELDS.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-medium">{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={formData[field.key] || ""}
                  onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.label}
                  rows={3}
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  step={field.type === "number" ? "any" : undefined}
                  value={formData[field.key] || ""}
                  onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.label}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isAdmin ? "Save Changes" : "Submit Suggestion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
