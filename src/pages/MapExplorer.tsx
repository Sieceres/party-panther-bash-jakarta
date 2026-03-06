import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Zap, X } from "lucide-react";
import { JAKARTA_AREAS } from "@/lib/area-config";
import { usePageTitle } from "@/hooks/usePageTitle";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapItem {
  id: string;
  title: string;
  venue_name: string;
  lat: number;
  lng: number;
  type: "promo" | "event";
  slug?: string | null;
  extra?: string; // discount_text or date
}

const PROMO_COLOR = "#10b981"; // emerald
const EVENT_COLOR = "#6366f1"; // indigo

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
  });
}

const JAKARTA_CENTER: [number, number] = [-6.2, 106.845];
const DEFAULT_ZOOM = 12;

export default function MapExplorer() {
  usePageTitle("Map Explorer");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  const [items, setItems] = useState<MapItem[]>([]);
  const [showPromos, setShowPromos] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [promosRes, eventsRes] = await Promise.all([
        supabase.rpc("get_promos_simple"),
        supabase.rpc("get_events_simple"),
      ]);

      const mapped: MapItem[] = [];

      if (promosRes.data) {
        for (const p of promosRes.data) {
          if (p.venue_latitude && p.venue_longitude) {
            mapped.push({
              id: p.id,
              title: p.title,
              venue_name: p.venue_name,
              lat: Number(p.venue_latitude),
              lng: Number(p.venue_longitude),
              type: "promo",
              slug: p.slug,
              extra: p.discount_text,
            });
          }
        }
      }

      if (eventsRes.data) {
        for (const e of eventsRes.data) {
          if (e.venue_latitude && e.venue_longitude) {
            mapped.push({
              id: e.id,
              title: e.title,
              venue_name: e.venue_name ?? "",
              lat: Number(e.venue_latitude),
              lng: Number(e.venue_longitude),
              type: "event",
              slug: e.slug,
              extra: e.date ? new Date(e.date).toLocaleDateString() : undefined,
            });
          }
        }
      }

      setItems(mapped);
      setLoading(false);
    }
    load();
  }, []);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { zoomControl: false }).setView(JAKARTA_CENTER, DEFAULT_ZOOM);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markersLayer.current = null;
    };
  }, []);

  // Filter visible items
  const visibleItems = useMemo(
    () =>
      items.filter((i) => {
        if (i.type === "promo" && !showPromos) return false;
        if (i.type === "event" && !showEvents) return false;
        return true;
      }),
    [items, showPromos, showEvents]
  );

  // Render markers
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    for (const item of visibleItems) {
      const icon = makeIcon(item.type === "promo" ? PROMO_COLOR : EVENT_COLOR);
      const detailUrl =
        item.type === "promo"
          ? `/promo/${item.slug || item.id}`
          : `/event/${item.slug || item.id}`;

      const typeLabel = item.type === "promo" ? "Promo" : "Event";
      const extraHtml = item.extra
        ? `<div style="font-size:12px;color:#888;margin-top:2px">${item.extra}</div>`
        : "";

      const popup = `
        <div style="min-width:180px;font-family:system-ui,sans-serif">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${item.type === "promo" ? PROMO_COLOR : EVENT_COLOR};margin-bottom:2px">${typeLabel}</div>
          <div style="font-weight:600;font-size:14px;line-height:1.3">${item.title}</div>
          <div style="font-size:12px;color:#666;margin-top:2px">${item.venue_name}</div>
          ${extraHtml}
          <a href="${detailUrl}" style="display:inline-block;margin-top:8px;font-size:12px;color:${item.type === "promo" ? PROMO_COLOR : EVENT_COLOR};font-weight:600;text-decoration:none">View Details →</a>
        </div>
      `;

      L.marker([item.lat, item.lng], { icon }).bindPopup(popup).addTo(markersLayer.current!);
    }
  }, [visibleItems]);

  // Region zoom
  const handleRegionClick = (regionKey: string) => {
    if (!mapInstance.current) return;
    if (activeRegion === regionKey) {
      setActiveRegion(null);
      mapInstance.current.setView(JAKARTA_CENTER, DEFAULT_ZOOM);
      return;
    }
    const region = JAKARTA_AREAS.find((r) => r.key === regionKey);
    if (region) {
      setActiveRegion(regionKey);
      mapInstance.current.setView([region.lat, region.lng], 14);
    }
  };

  const promoCount = visibleItems.filter((i) => i.type === "promo").length;
  const eventCount = visibleItems.filter((i) => i.type === "event").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeSection="map" onSectionChange={() => {}} />

      <div className="flex-1 relative pt-16">
        {/* Controls overlay */}
        <div className="absolute top-2 left-2 right-2 z-[1000] pointer-events-none">
          <div className="flex flex-wrap gap-2 items-center pointer-events-auto">
            {/* Type toggles */}
            <Button
              size="sm"
              variant={showPromos ? "default" : "outline"}
              onClick={() => setShowPromos(!showPromos)}
              className="shadow-lg gap-1.5"
              style={showPromos ? { backgroundColor: PROMO_COLOR, borderColor: PROMO_COLOR } : {}}
            >
              <Zap className="w-3.5 h-3.5" />
              Promos ({promoCount})
            </Button>
            <Button
              size="sm"
              variant={showEvents ? "default" : "outline"}
              onClick={() => setShowEvents(!showEvents)}
              className="shadow-lg gap-1.5"
              style={showEvents ? { backgroundColor: EVENT_COLOR, borderColor: EVENT_COLOR } : {}}
            >
              <Calendar className="w-3.5 h-3.5" />
              Events ({eventCount})
            </Button>

            {/* Region chips */}
            {JAKARTA_AREAS.map((region) => (
              <Badge
                key={region.key}
                variant={activeRegion === region.key ? "default" : "outline"}
                className="cursor-pointer shadow-sm hover:shadow-md transition-shadow bg-background/90 backdrop-blur-sm text-xs"
                onClick={() => handleRegionClick(region.key)}
              >
                {activeRegion === region.key && <X className="w-3 h-3 mr-1" />}
                {region.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 animate-bounce" />
              Loading map data...
            </div>
          </div>
        )}

        {/* Map container */}
        <div ref={mapRef} className="w-full h-[calc(100vh-4rem)]" />
      </div>
    </div>
  );
}
