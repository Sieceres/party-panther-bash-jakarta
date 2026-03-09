import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Search } from "lucide-react";
import L from "leaflet";

interface VenueLocationEditorProps {
  venueId: string;
  venueName: string;
  currentLat: number | null;
  currentLng: number | null;
  currentAddress: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function VenueLocationEditor({
  venueId, venueName, currentLat, currentLng, currentAddress,
  open, onOpenChange, onSaved,
}: VenueLocationEditorProps) {
  const [lat, setLat] = useState(currentLat?.toString() || "");
  const [lng, setLng] = useState(currentLng?.toString() || "");
  const [address, setAddress] = useState(currentAddress || "");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setLat(currentLat?.toString() || "");
      setLng(currentLng?.toString() || "");
      setAddress(currentAddress || "");
    }
  }, [open, currentLat, currentLng, currentAddress]);

  // Init mini map
  useEffect(() => {
    if (!open || !mapRef.current || mapInstance.current) return;

    const initLat = currentLat || -6.2;
    const initLng = currentLng || 106.845;

    const map = L.map(mapRef.current).setView([initLat, initLng], currentLat ? 16 : 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OSM',
    }).addTo(map);

    if (currentLat && currentLng) {
      const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setLat(pos.lat.toFixed(7));
        setLng(pos.lng.toFixed(7));
      });
      markerRef.current = marker;
    }

    // Click to place/move marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      setLat(clickLat.toFixed(7));
      setLng(clickLng.toFixed(7));

      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setLat(pos.lat.toFixed(7));
          setLng(pos.lng.toFixed(7));
        });
        markerRef.current = marker;
      }
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
  }, [open]);

  const handleSearch = useCallback(async () => {
    const query = searchQuery || venueName;
    if (!query) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({
        type: "search", q: query + " Jakarta", limit: "1",
        lat: "-6.2088", lon: "106.8456",
      });
      const res = await fetch(`https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/photon-proxy?${params}`);
      const data = await res.json();
      if (data.features?.length > 0) {
        const [fLng, fLat] = data.features[0].geometry.coordinates;
        setLat(fLat.toFixed(7));
        setLng(fLng.toFixed(7));
        const props = data.features[0].properties;
        const parts = [props.name, props.street, props.city, props.country].filter(Boolean);
        if (parts.length) setAddress(parts.join(", "));

        if (mapInstance.current) {
          mapInstance.current.setView([fLat, fLng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([fLat, fLng]);
          } else {
            const marker = L.marker([fLat, fLng], { draggable: true }).addTo(mapInstance.current);
            marker.on("dragend", () => {
              const pos = marker.getLatLng();
              setLat(pos.lat.toFixed(7));
              setLng(pos.lng.toFixed(7));
            });
            markerRef.current = marker;
          }
        }
        toast.success("Location found — adjust pin if needed");
      } else {
        toast.error("No results found");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }, [searchQuery, venueName]);

  const handleSave = async () => {
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || isNaN(numLng)) {
      toast.error("Please enter valid coordinates");
      return;
    }
    setSaving(true);
    try {
      // Update venue
      const { error: venueError } = await supabase
        .from("venues")
        .update({ latitude: numLat, longitude: numLng, address: address || null })
        .eq("id", venueId);
      if (venueError) throw venueError;

      // Also update promos linked to this venue
      await supabase
        .from("promos")
        .update({ venue_latitude: numLat, venue_longitude: numLng, venue_address: address || null })
        .eq("venue_id", venueId);

      // Also update events linked to this venue
      await supabase
        .from("events")
        .update({ venue_latitude: numLat, venue_longitude: numLng, venue_address: address || null })
        .eq("venue_id", venueId);

      toast.success("Venue location updated");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving venue location:", error);
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Edit Location: {venueName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder={`Search for "${venueName}"...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching} size="sm" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Mini map - click or drag to set location */}
          <div ref={mapRef} className="w-full h-52 rounded-lg border" />
          <p className="text-xs text-muted-foreground">Click the map or drag the pin to set the exact location.</p>

          {/* Coordinate inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Latitude</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-6.2088" />
            </div>
            <div>
              <Label className="text-xs">Longitude</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="106.8456" />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label className="text-xs">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Venue address..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
