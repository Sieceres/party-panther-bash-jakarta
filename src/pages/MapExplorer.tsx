import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Zap, X, LocateFixed, Loader2, Store } from "lucide-react";
import { NEIGHBORHOOD_COORDS, JAKARTA_AREAS } from "@/lib/area-config";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Helmet } from "react-helmet-async";
import { NearbyPanel } from "@/components/map/NearbyPanel";
import { toast } from "sonner";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface MapItem {
  id: string;
  title: string;
  venue_name: string;
  lat: number;
  lng: number;
  type: "promo" | "event" | "venue";
  slug?: string | null;
  extra?: string;
  day_of_week?: string[];
  drink_type?: string[];
  promo_type?: string | null;
}

const PROMO_COLOR = "#10b981";
const EVENT_COLOR = "#6366f1";
const VENUE_COLOR = "#f59e0b";
const USER_COLOR = "#3b82f6";

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

function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${USER_COLOR};border:3px solid white;
      box-shadow:0 0 0 3px ${USER_COLOR}40, 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse-ring 2s ease-out infinite;
    "></div>
    <style>
      @keyframes pulse-ring {
        0% { box-shadow: 0 0 0 3px ${USER_COLOR}40, 0 2px 8px rgba(0,0,0,0.3); }
        50% { box-shadow: 0 0 0 8px ${USER_COLOR}15, 0 2px 8px rgba(0,0,0,0.3); }
        100% { box-shadow: 0 0 0 3px ${USER_COLOR}40, 0 2px 8px rgba(0,0,0,0.3); }
      }
    </style>`,
  });
}

const JAKARTA_CENTER: [number, number] = [-6.2, 106.845];
const DEFAULT_ZOOM = 12;

const DAY_OPTIONS = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

const DRINK_TYPE_OPTIONS = [
  "Beer", "Cocktails", "Coffee & Tea", "Drinks", "Food", "Spirits", "Wine",
];

function resolveCoords(
  venueLat: number | null,
  venueLng: number | null,
  area: string | null | undefined
): { lat: number; lng: number } | null {
  if (venueLat && venueLng) return { lat: Number(venueLat), lng: Number(venueLng) };
  if (area) {
    const nc = NEIGHBORHOOD_COORDS[area];
    if (nc) return nc;
    for (const region of JAKARTA_AREAS) {
      if (region.neighborhoods.some((n) => n.toLowerCase() === area.toLowerCase())) {
        const match = NEIGHBORHOOD_COORDS[region.neighborhoods.find((n) => n.toLowerCase() === area.toLowerCase())!];
        if (match) return match;
        return { lat: region.lat, lng: region.lng };
      }
      if (region.key === area.toLowerCase() || region.label.toLowerCase() === area.toLowerCase()) {
        return { lat: region.lat, lng: region.lng };
      }
    }
  }
  return null;
}

function getColorForType(type: string) {
  if (type === "promo") return PROMO_COLOR;
  if (type === "event") return EVENT_COLOR;
  return VENUE_COLOR;
}

export default function MapExplorer() {
  usePageTitle("Map Explorer");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const clusterGroup = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  const [items, setItems] = useState<MapItem[]>([]);
  const [showPromos, setShowPromos] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showVenues, setShowVenues] = useState(true);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dayFilter, setDayFilter] = useState<string[]>(["all"]);
  const [drinkTypeFilter, setDrinkTypeFilter] = useState<string[]>(["all"]);

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);

  // Fetch data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [promosRes, eventsRes, venuesRes] = await Promise.all([
        supabase.rpc("get_promos_simple"),
        supabase.rpc("get_events_simple"),
        supabase.from("venues").select("id, name, slug, address, latitude, longitude, description"),
      ]);

      const mapped: MapItem[] = [];

      if (promosRes.data) {
        for (const p of promosRes.data) {
          const coords = resolveCoords(p.venue_latitude, p.venue_longitude, p.area);
          if (coords) {
            mapped.push({
              id: p.id, title: p.title, venue_name: p.venue_name,
              lat: coords.lat, lng: coords.lng, type: "promo",
              slug: p.slug, extra: p.discount_text,
              day_of_week: p.day_of_week ?? [], drink_type: p.drink_type ?? [],
              promo_type: p.promo_type,
            });
          }
        }
      }

      if (eventsRes.data) {
        for (const e of eventsRes.data) {
          const coords = resolveCoords(e.venue_latitude, e.venue_longitude, null);
          if (coords) {
            mapped.push({
              id: e.id, title: e.title, venue_name: e.venue_name ?? "",
              lat: coords.lat, lng: coords.lng, type: "event",
              slug: e.slug, extra: e.date ? new Date(e.date).toLocaleDateString() : undefined,
            });
          }
        }
      }

      // Add venues that have coordinates (including those without promos/events)
      if (venuesRes.data) {
        for (const v of venuesRes.data) {
          if (v.latitude && v.longitude) {
            mapped.push({
              id: v.id,
              title: v.name,
              venue_name: v.address || "Venue",
              lat: Number(v.latitude),
              lng: Number(v.longitude),
              type: "venue",
              slug: v.slug,
              extra: v.description ? v.description.substring(0, 60) : undefined,
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

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        const markers = c.getAllChildMarkers();
        const hasPromo = markers.some((m: any) => m.options._itemType === "promo");
        const hasEvent = markers.some((m: any) => m.options._itemType === "event");
        const hasVenue = markers.some((m: any) => m.options._itemType === "venue");
        
        let bg = VENUE_COLOR;
        if (hasPromo && hasEvent) bg = `linear-gradient(135deg, ${PROMO_COLOR} 50%, ${EVENT_COLOR} 50%)`;
        else if (hasPromo) bg = PROMO_COLOR;
        else if (hasEvent) bg = EVENT_COLOR;

        return L.divIcon({
          className: "",
          iconSize: [36, 36],
          html: `<div style="
            width:36px;height:36px;border-radius:50%;
            background:${bg};border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:700;font-size:13px;font-family:system-ui;
          ">${count}</div>`,
        });
      },
    });

    cluster.addTo(map);
    clusterGroup.current = cluster;
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      clusterGroup.current = null;
    };
  }, []);

  // Filter visible items
  const visibleItems = useMemo(() =>
    items.filter((i) => {
      if (i.type === "promo" && !showPromos) return false;
      if (i.type === "event" && !showEvents) return false;
      if (i.type === "venue" && !showVenues) return false;

      if (i.type === "promo" && !dayFilter.includes("all")) {
        const itemDays = (i.day_of_week || []).map((d) => d.toLowerCase());
        if (!dayFilter.some((f) => itemDays.includes(f.toLowerCase()))) return false;
      }

      if (i.type === "promo" && !drinkTypeFilter.includes("all")) {
        const itemDrinks = (i.drink_type || []).map((d) => d.toLowerCase());
        if (!drinkTypeFilter.some((f) => itemDrinks.includes(f.toLowerCase()))) return false;
      }

      return true;
    }),
    [items, showPromos, showEvents, showVenues, dayFilter, drinkTypeFilter]
  );

  // Render markers into cluster group
  useEffect(() => {
    if (!clusterGroup.current) return;
    clusterGroup.current.clearLayers();

    for (const item of visibleItems) {
      const color = getColorForType(item.type);
      const icon = makeIcon(color);
      
      let detailUrl: string;
      let typeLabel: string;
      if (item.type === "promo") {
        detailUrl = `/promo/${item.slug || item.id}`;
        typeLabel = "Promo";
      } else if (item.type === "event") {
        detailUrl = `/event/${item.slug || item.id}`;
        typeLabel = "Event";
      } else {
        detailUrl = `/venue/${item.slug || item.id}`;
        typeLabel = "Venue";
      }

      const extraHtml = item.extra
        ? `<div style="font-size:12px;color:#888;margin-top:2px">${item.extra}</div>`
        : "";

      const popup = `
        <div style="min-width:180px;font-family:system-ui,sans-serif">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${color};margin-bottom:2px">${typeLabel}</div>
          <div style="font-weight:600;font-size:14px;line-height:1.3">${item.title}</div>
          <div style="font-size:12px;color:#666;margin-top:2px">${item.venue_name}</div>
          ${extraHtml}
          <a href="${detailUrl}" style="display:inline-block;margin-top:8px;font-size:12px;color:${color};font-weight:600;text-decoration:none">View Details →</a>
        </div>
      `;

      const marker = L.marker([item.lat, item.lng], {
        icon,
        _itemType: item.type,
      } as any).bindPopup(popup);

      clusterGroup.current.addLayer(marker);
    }
  }, [visibleItems]);

  // Update user marker + radius circle when location or radius changes
  useEffect(() => {
    if (!mapInstance.current) return;

    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (radiusCircleRef.current) {
      mapInstance.current.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    if (userLocation) {
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon: makeUserIcon(), zIndexOffset: 1000 })
        .addTo(mapInstance.current)
        .bindPopup('<div style="font-family:system-ui;font-weight:600;font-size:13px">📍 You are here</div>');
      userMarkerRef.current = marker;

      if (radiusKm) {
        const circle = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusKm * 1000,
          color: USER_COLOR,
          fillColor: USER_COLOR,
          fillOpacity: 0.08,
          weight: 2,
          dashArray: "6 4",
        }).addTo(mapInstance.current);
        radiusCircleRef.current = circle;
      }
    }
  }, [userLocation, radiusKm]);

  // Locate me
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocating(false);
        if (mapInstance.current) {
          mapInstance.current.setView([loc.lat, loc.lng], 14);
        }
        toast.success("Location found!");
      },
      (err) => {
        setLocating(false);
        toast.error(`Could not get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Handle item click from nearby panel
  const handleNearbyItemClick = useCallback((item: MapItem) => {
    if (!mapInstance.current) return;
    mapInstance.current.setView([item.lat, item.lng], 17);
    if (clusterGroup.current) {
      clusterGroup.current.eachLayer((layer: any) => {
        const latlng = layer.getLatLng();
        if (Math.abs(latlng.lat - item.lat) < 0.0001 && Math.abs(latlng.lng - item.lng) < 0.0001) {
          setTimeout(() => layer.openPopup(), 300);
        }
      });
    }
  }, []);

  const eventCount = visibleItems.filter((i) => i.type === "event").length;
  const promoCount = visibleItems.filter((i) => i.type === "promo").length;
  const venueCount = visibleItems.filter((i) => i.type === "venue").length;

  const hasActiveFilters = !dayFilter.includes("all") || !drinkTypeFilter.includes("all");

  const getFilterDisplayText = (filters: string[], allLabel: string) => {
    if (filters.includes("all")) return allLabel;
    if (filters.length === 1) return filters[0].charAt(0).toUpperCase() + filters[0].slice(1);
    return `${filters.length} selected`;
  };

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      const newFilters = dayFilter.filter((f) => f !== "all");
      setDayFilter([...newFilters, day]);
    } else {
      const newFilters = dayFilter.filter((f) => f !== day);
      setDayFilter(newFilters.length === 0 ? ["all"] : newFilters);
    }
  };

  const handleDrinkChange = (drink: string, checked: boolean) => {
    if (checked) {
      const newFilters = drinkTypeFilter.filter((f) => f !== "all");
      setDrinkTypeFilter([...newFilters, drink]);
    } else {
      const newFilters = drinkTypeFilter.filter((f) => f !== drink);
      setDrinkTypeFilter(newFilters.length === 0 ? ["all"] : newFilters);
    }
  };

  const clearFilters = () => {
    setDayFilter(["all"]);
    setDrinkTypeFilter(["all"]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeSection="map" />

      <div className="flex-1 relative pt-16">
        {/* Controls overlay */}
        <div className="absolute top-[4.5rem] left-2 right-2 z-[1000] pointer-events-none">
          <div className="flex flex-wrap gap-2 items-center pointer-events-auto">
            {/* Locate me button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleLocateMe}
              disabled={locating}
              className="shadow-lg gap-1.5 bg-background/95 backdrop-blur-sm"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
              {locating ? "Locating..." : "Near me"}
            </Button>

            {/* Type toggles — order: Events, Promos, Venues */}
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
              variant={showVenues ? "default" : "outline"}
              onClick={() => setShowVenues(!showVenues)}
              className="shadow-lg gap-1.5"
              style={showVenues ? { backgroundColor: VENUE_COLOR, borderColor: VENUE_COLOR } : {}}
            >
              <Store className="w-3.5 h-3.5" />
              Venues ({venueCount})
            </Button>

            {/* Day filter */}
            <Select>
              <SelectTrigger className="h-8 w-auto min-w-[100px] shadow-lg bg-background/95 backdrop-blur-sm text-xs border">
                <SelectValue placeholder={getFilterDisplayText(dayFilter, "All days")} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={dayFilter.includes("all")}
                      onCheckedChange={(checked) => { if (checked) setDayFilter(["all"]); }}
                    />
                    All days
                  </label>
                  {DAY_OPTIONS.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={dayFilter.includes(d.id)}
                        onCheckedChange={(checked) => handleDayChange(d.id, !!checked)}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </SelectContent>
            </Select>

            {/* Drink type filter */}
            <Select>
              <SelectTrigger className="h-8 w-auto min-w-[100px] shadow-lg bg-background/95 backdrop-blur-sm text-xs border">
                <SelectValue placeholder={getFilterDisplayText(drinkTypeFilter, "All types")} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={drinkTypeFilter.includes("all")}
                      onCheckedChange={(checked) => { if (checked) setDrinkTypeFilter(["all"]); }}
                    />
                    All types
                  </label>
                  {DRINK_TYPE_OPTIONS.map((drink) => (
                    <label key={drink} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={drinkTypeFilter.includes(drink.toLowerCase())}
                        onCheckedChange={(checked) => handleDrinkChange(drink.toLowerCase(), !!checked)}
                      />
                      {drink}
                    </label>
                  ))}
                </div>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="h-8 text-xs shadow-sm bg-background/90 backdrop-blur-sm">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
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

        {/* Nearby panel */}
        <NearbyPanel
          items={visibleItems}
          userLocation={userLocation}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          onItemClick={handleNearbyItemClick}
        />

        {/* Map container */}
        <div ref={mapRef} className="w-full h-[calc(100vh-4rem)]" />
      </div>
    </div>
  );
}
