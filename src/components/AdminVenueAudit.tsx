import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ExternalLink, AlertTriangle, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Venue {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  instagram: string | null;
  whatsapp: string | null;
  website: string | null;
  google_maps_link: string | null;
  opening_hours: string | null;
  description: string | null;
  image_url: string | null;
}

const REQUIRED_FIELDS: { key: keyof Venue; label: string }[] = [
  { key: "address", label: "Address" },
  { key: "latitude", label: "Coordinates" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "website", label: "Website" },
  { key: "google_maps_link", label: "Maps Link" },
  { key: "opening_hours", label: "Hours" },
  { key: "description", label: "Description" },
  { key: "image_url", label: "Image" },
];

const JAKARTA_KEYWORDS = [
  "jakarta", "jkt", "dki", "kemang", "senopati", "gunawarman", "scbd",
  "senayan", "sudirman", "thamrin", "kuningan", "setiabudi", "menteng",
  "cikini", "kota tua", "pik", "kelapa gading", "ancol", "grogol",
  "kebon jeruk", "blok m", "melawai", "mega kuningan", "pantai indah",
  "pluit", "sunter", "tebet", "manggarai", "fatmawati", "pondok indah",
  "cipete", "cilandak", "gandaria", "permata hijau", "kebayoran",
];

function getMissingFields(venue: Venue): string[] {
  const missing: string[] = [];
  for (const f of REQUIRED_FIELDS) {
    const val = venue[f.key];
    if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
      // latitude check covers longitude too
      if (f.key === "latitude" && venue.longitude != null) continue;
      missing.push(f.label);
    }
  }
  return missing;
}

function isOutsideJakarta(venue: Venue): boolean {
  if (!venue.address) return false;
  const lower = venue.address.toLowerCase();
  return !JAKARTA_KEYWORDS.some((kw) => lower.includes(kw));
}

export const AdminVenueAudit = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingFilter, setMissingFilter] = useState<string>("all");

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, slug, address, latitude, longitude, instagram, whatsapp, website, google_maps_link, opening_hours, description, image_url")
        .order("name");
      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const incompleteVenues = useMemo(
    () =>
      venues
        .map((v) => ({ ...v, missingFields: getMissingFields(v) }))
        .filter((v) => v.missingFields.length > 0)
        .filter((v) => missingFilter === "all" || v.missingFields.includes(missingFilter))
        .sort((a, b) => b.missingFields.length - a.missingFields.length),
    [venues, missingFilter]
  );

  const outsideJakarta = useMemo(
    () => venues.filter(isOutsideJakarta),
    [venues]
  );

  const completionRate = venues.length
    ? Math.round(((venues.length - incompleteVenues.length) / venues.length) * 100)
    : 0;

  if (loading) {
    return <div className="text-center py-8">Loading venue audit...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{venues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {venues.length - incompleteVenues.length}
            </div>
            <p className="text-xs text-muted-foreground">{completionRate}% completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{incompleteVenues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4 text-red-500" /> Outside Jakarta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outsideJakarta.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchVenues}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="missing">
        <TabsList>
          <TabsTrigger value="missing">
            Missing Info ({incompleteVenues.length})
          </TabsTrigger>
          <TabsTrigger value="outside">
            Outside Jakarta ({outsideJakarta.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missing">
          {incompleteVenues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              All venues have complete information! 🎉
            </p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Missing Fields</TableHead>
                    <TableHead className="text-center">Count</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incompleteVenues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">{venue.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {venue.missingFields.map((f) => (
                            <Badge key={f} variant="outline" className="text-xs text-amber-600 border-amber-300">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={venue.missingFields.length >= 5 ? "destructive" : "secondary"}>
                          {venue.missingFields.length}/{REQUIRED_FIELDS.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(`/venue/${venue.slug || venue.id}`, "_blank")
                          }
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="outside">
          {outsideJakarta.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              All venues with addresses are within Jakarta! 🎉
            </p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outsideJakarta.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">{venue.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {venue.address}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(`/venue/${venue.slug || venue.id}`, "_blank")
                          }
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
