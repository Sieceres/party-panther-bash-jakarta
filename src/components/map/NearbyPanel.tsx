import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Navigation, ChevronUp, ChevronDown, Zap, Calendar, Store } from "lucide-react";

interface MapItem {
  id: string;
  title: string;
  venue_name: string;
  lat: number;
  lng: number;
  type: "promo" | "event" | "venue";
  slug?: string | null;
  extra?: string;
}

interface NearbyPanelProps {
  items: MapItem[];
  userLocation: { lat: number; lng: number } | null;
  radiusKm: number | null;
  onRadiusChange: (radius: number | null) => void;
  onItemClick: (item: MapItem) => void;
}

const RADIUS_OPTIONS = [1, 3, 5, 10];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function getItemIcon(type: string) {
  if (type === "event") return <Calendar className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />;
  if (type === "promo") return <Zap className="w-3.5 h-3.5" style={{ color: "#10b981" }} />;
  return <Store className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />;
}

export function NearbyPanel({ items, userLocation, radiusKm, onRadiusChange, onItemClick }: NearbyPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const sortedItems = useMemo(() => {
    if (!userLocation) return [];
    return items
      .map((item) => ({
        ...item,
        distance: haversineKm(userLocation.lat, userLocation.lng, item.lat, item.lng),
      }))
      .filter((item) => (radiusKm ? item.distance <= radiusKm : true))
      .sort((a, b) => a.distance - b.distance);
  }, [items, userLocation, radiusKm]);

  if (!userLocation) return null;

  return (
    <div className="absolute bottom-4 left-2 right-2 z-[1000] pointer-events-none md:left-2 md:right-auto md:bottom-4 md:w-80">
      <div className="pointer-events-auto bg-background/95 backdrop-blur-md rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Nearby ({sortedItems.length})</span>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </button>

        {expanded && (
          <>
            {/* Radius filter */}
            <div className="px-3 py-2 border-t border-border flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Radius:</span>
              {RADIUS_OPTIONS.map((r) => (
                <Badge
                  key={r}
                  variant={radiusKm === r ? "default" : "outline"}
                  className="cursor-pointer text-xs px-2 py-0.5"
                  onClick={() => onRadiusChange(radiusKm === r ? null : r)}
                >
                  {r}km
                </Badge>
              ))}
              {radiusKm && (
                <Button size="sm" variant="ghost" className="h-5 px-1 text-xs" onClick={() => onRadiusChange(null)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* List */}
            <ScrollArea className="max-h-60 border-t border-border">
              {sortedItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No places found{radiusKm ? ` within ${radiusKm}km` : ""}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedItems.slice(0, 20).map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => onItemClick(item)}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-start gap-2"
                    >
                      <div className="mt-0.5">
                        {getItemIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.venue_name}</div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                        {formatDistance(item.distance)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
