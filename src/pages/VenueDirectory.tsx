import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AreaFilterList } from "@/components/ui/area-filter";
import { Header } from "@/components/Header";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { JAKARTA_AREAS, areaMatchesFilter, getAllNeighborhoods } from "@/lib/area-config";
import { MapPin, Search, Store, Grid3X3, Map as MapIcon, Instagram, Globe, ArrowUpDown } from "lucide-react";
import { AddVenueDialog } from "@/components/AddVenueDialog";
import L from "leaflet";

interface VenueRow {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  instagram: string | null;
  website: string | null;
  claim_status: string;
  promo_count: number;
  event_count: number;
  area: string | null;
}

type SortOption = "name-asc" | "name-desc" | "promos" | "events";

export default function VenueDirectory() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [view, setView] = useState<"grid" | "map">("grid");

  usePageTitle("Venues");

  const fetchVenues = async () => {
    const { data: venueData } = await supabase.from("venues").select("*").order("name");
    if (!venueData) { setLoading(false); return; }

    const { data: promoCounts } = await supabase.from("promos").select("venue_id");
    const { data: eventCounts } = await supabase.from("events").select("venue_id");

    const promoMap = new Map<string, number>();
    promoCounts?.forEach(p => {
      if (p.venue_id) promoMap.set(p.venue_id, (promoMap.get(p.venue_id) || 0) + 1);
    });
    const eventMap = new Map<string, number>();
    eventCounts?.forEach(e => {
      if (e.venue_id) eventMap.set(e.venue_id, (eventMap.get(e.venue_id) || 0) + 1);
    });

    const enriched: VenueRow[] = venueData.map(v => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      address: v.address,
      latitude: v.latitude ? Number(v.latitude) : null,
      longitude: v.longitude ? Number(v.longitude) : null,
      image_url: v.image_url,
      instagram: v.instagram,
      website: v.website,
      claim_status: v.claim_status,
      promo_count: promoMap.get(v.id) || 0,
      event_count: eventMap.get(v.id) || 0,
      area: guessNeighborhood(v.address),
    }));

    setVenues(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchVenues(); }, []);

  // Guess neighborhood from address string (returns neighborhood name or null)
  function guessNeighborhood(address: string | null): string | null {
    if (!address) return null;
    const lower = address.toLowerCase();
    for (const region of JAKARTA_AREAS) {
      for (const n of region.neighborhoods) {
        if (lower.includes(n.toLowerCase())) return n;
      }
    }
    return null;
  }

  const filtered = useMemo(() => {
    let list = venues;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q) || v.address?.toLowerCase().includes(q));
    }
    if (areaFilter !== "all") {
      list = list.filter(v => areaMatchesFilter(v.area, [areaFilter]));
    }
    const sortName = (name: string) => name.replace(/^the\s+/i, "");
    switch (sort) {
      case "name-asc": list = [...list].sort((a, b) => sortName(a.name).localeCompare(sortName(b.name))); break;
      case "name-desc": list = [...list].sort((a, b) => sortName(b.name).localeCompare(sortName(a.name))); break;
      case "promos": list = [...list].sort((a, b) => b.promo_count - a.promo_count); break;
      case "events": list = [...list].sort((a, b) => b.event_count - a.event_count); break;
    }
    return list;
  }, [venues, search, areaFilter, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection="venues" />
      <div className="pt-20 px-4 pb-12">
        <div className="container mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
                <Store className="w-8 h-8 text-primary" />
                Venue Directory
              </h1>
              <p className="text-muted-foreground">Discover bars, clubs, and restaurants across Jakarta</p>
            </div>
            <AddVenueDialog onVenueAdded={fetchVenues} />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search venues..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  {areaFilter === "all" ? "All areas" : areaFilter}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="start">
                <AreaFilterList
                  selectedValues={areaFilter === "all" ? [] : [areaFilter]}
                  onToggle={(val) => setAreaFilter(val === areaFilter ? "all" : val)}
                  showAll
                  allChecked={areaFilter === "all"}
                  onAllToggle={() => setAreaFilter("all")}
                  singleSelect
                />
              </PopoverContent>
            </Popover>

            <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A–Z</SelectItem>
                <SelectItem value="name-desc">Name Z–A</SelectItem>
                <SelectItem value="promos">Most promos</SelectItem>
                <SelectItem value="events">Most events</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                size="sm"
                variant={view === "grid" ? "default" : "ghost"}
                onClick={() => setView("grid")}
                className="rounded-none gap-1.5"
              >
                <Grid3X3 className="w-4 h-4" /> Grid
              </Button>
              <Button
                size="sm"
                variant={view === "map" ? "default" : "ghost"}
                onClick={() => setView("map")}
                className="rounded-none gap-1.5"
              >
                <MapIcon className="w-4 h-4" /> Map
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} venue{filtered.length !== 1 ? "s" : ""} found</p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <SpinningPaws size="lg" />
              <p className="text-muted-foreground">Loading venues...</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(venue => (
                <VenueCard key={venue.id} venue={venue} onClick={() => navigate(`/venue/${venue.slug || venue.id}`)} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  No venues match your search.
                </div>
              )}
            </div>
          ) : (
            <VenueMapView venues={filtered} onVenueClick={v => navigate(`/venue/${v.slug || v.id}`)} />
          )}
        </div>
      </div>
    </div>
  );
}

function VenueCard({ venue, onClick }: { venue: VenueRow; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/30 overflow-hidden group"
      onClick={onClick}
    >
      {venue.image_url ? (
        <div className="aspect-[2/1] overflow-hidden bg-muted">
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="aspect-[2/1] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <Store className="w-10 h-10 text-primary/30" />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{venue.name}</h3>
        {venue.address && (
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{venue.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {venue.promo_count > 0 && (
            <Badge variant="secondary" className="text-xs">{venue.promo_count} promo{venue.promo_count !== 1 ? "s" : ""}</Badge>
          )}
          {venue.event_count > 0 && (
            <Badge variant="outline" className="text-xs">{venue.event_count} event{venue.event_count !== 1 ? "s" : ""}</Badge>
          )}
          {venue.claim_status === "approved" && (
            <Badge variant="default" className="text-xs">✓ Claimed</Badge>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          {venue.instagram && <Instagram className="w-3.5 h-3.5 text-muted-foreground" />}
          {venue.website && <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

function VenueMapView({ venues, onVenueClick }: { venues: VenueRow[]; onVenueClick: (v: VenueRow) => void }) {
  const mapRef = useState<HTMLDivElement | null>(null);
  const [mapDiv, setMapDiv] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapDiv) return;

    const map = L.map(mapDiv).setView([-6.2, 106.845], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OSM',
    }).addTo(map);

    const geoVenues = venues.filter(v => v.latitude && v.longitude);

    geoVenues.forEach(v => {
      const marker = L.marker([v.latitude!, v.longitude!]).addTo(map);
      marker.bindPopup(`
        <div style="min-width:150px">
          <strong style="font-size:14px">${v.name}</strong>
          ${v.address ? `<br/><span style="font-size:12px;color:#888">${v.address}</span>` : ""}
          <br/><span style="font-size:11px">${v.promo_count} promos · ${v.event_count} events</span>
          <br/><a href="/venue/${v.slug || v.id}" style="font-size:12px;color:#10b981">View venue →</a>
        </div>
      `);
      marker.on("click", () => marker.openPopup());
    });

    if (geoVenues.length > 0) {
      const bounds = L.latLngBounds(geoVenues.map(v => [v.latitude!, v.longitude!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => { map.remove(); };
  }, [mapDiv, venues]);

  return (
    <div
      ref={el => setMapDiv(el)}
      className="w-full h-[60vh] rounded-lg border overflow-hidden"
    />
  );
}
