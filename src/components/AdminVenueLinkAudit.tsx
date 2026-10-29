import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, RefreshCw, ExternalLink, Pencil, Link2Off, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEventUrl, getPromoUrl, getEditEventUrl, getEditPromoUrl } from "@/lib/slug-utils";
import { fetchAllAuditRows, findUnlinkedVenueItems, type VenueLinkedItem } from "@/lib/venue-link-audit";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type AuditResult = VenueLinkedItem & { kind: "promo" | "event" };
type RepairMatch = Database["public"]["Functions"]["preview_promo_venue_repairs"]["Returns"][number];

export const AdminVenueLinkAudit = () => {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<RepairMatch[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewing, setPreviewing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [repairStatus, setRepairStatus] = useState<string | null>(null);

  const previewRepairs = async () => {
    setPreviewing(true);
    setError(null);
    setRepairStatus(null);
    setMatches(null);
    setSelected(new Set());
    try {
      const rows = await fetchAllAuditRows<RepairMatch>((from, to) => supabase.rpc("preview_promo_venue_repairs").range(from, to));
      setMatches(rows);
      setSelected(new Set(rows.map(row => row.promo_id)));
    } catch {
      setError("Could not preview repairs. Please try again.");
    } finally {
      setPreviewing(false);
    }
  };

  const applyRepairs = async () => {
    setRepairing(true);
    setError(null);
    const chosen = (matches || []).filter(row => selected.has(row.promo_id));
    let total = 0;
    try {
      for (let start = 0; start < chosen.length; start += 1000) {
        const { data, error: repairError } = await supabase.rpc("apply_promo_venue_repairs", {
          _matches: chosen.slice(start, start + 1000).map(row => ({ promo_id: row.promo_id, matched_venue_id: row.matched_venue_id })),
        });
        if (repairError) throw repairError;
        total += data || 0;
      }
      setRepairStatus(`${total} promos linked.${total < chosen.length ? " Changed or no longer unique matches were skipped." : ""}`);
      await checkLinks();
    } catch {
      setError(`Repair stopped. ${total} promos linked before the error. Preview again to retry remaining matches.`);
    } finally {
      setMatches(null);
      setSelected(new Set());
      setRepairing(false);
    }
  };

  const checkLinks = async () => {
    setChecking(true);
    setError(null);
    try {
      const [venues, promos, events] = await Promise.all([
        fetchAllAuditRows<{ id: string }>((from, to) => supabase.from("venues").select("id").order("id").range(from, to)),
        fetchAllAuditRows<VenueLinkedItem>((from, to) => supabase.from("promos").select("id,title,venue_id,venue_name,slug").order("id").range(from, to)),
        fetchAllAuditRows<VenueLinkedItem>((from, to) => supabase.from("events").select("id,title,venue_id,venue_name,slug").order("id").range(from, to)),
      ]);
      const venueIds = new Set(venues.map(venue => venue.id));
      setResults([
        ...findUnlinkedVenueItems(promos, venueIds).map(row => ({ ...row, kind: "promo" as const })),
        ...findUnlinkedVenueItems(events, venueIds).map(row => ({ ...row, kind: "event" as const })),
      ]);
      setCheckedAt(new Date());
    } catch {
      setError("Could not complete the venue-link check. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const visible = useMemo(() => results.filter(row =>
    (filter === "all" || row.kind === filter) &&
    `${row.title} ${row.venue_name || ""}`.toLowerCase().includes(search.toLowerCase())
  ), [results, filter, search]);

  return (
    <section className="space-y-4 border-b pb-6" aria-labelledby="venue-link-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="venue-link-heading" className="flex items-center gap-2 text-xl font-semibold">
          <Link2Off className="h-5 w-5" />Unlinked promos & events
        </h2>
        <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={previewRepairs} disabled={checking || previewing || repairing}>
          <Link2 className="mr-2 h-4 w-4" />{previewing ? "Finding matches…" : "Preview promo repairs"}
        </Button>
        <Button onClick={checkLinks} disabled={checking || previewing || repairing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking…" : "Check venue links"}
        </Button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {repairStatus && <p role="status" className="text-sm">{repairStatus}</p>}
      {matches && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">{matches.length} unique venue matches</h3>
            {matches.length > 0 && <Button onClick={() => setConfirmOpen(true)} disabled={selected.size === 0 || repairing}>Link {selected.size} promos</Button>}
          </div>
          {matches.length === 0 ? <p className="text-sm text-muted-foreground">No unique matches found. Use the edit links below to choose venues manually.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead><Checkbox aria-label="Select all repair matches" checked={selected.size === matches.length ? true : selected.size > 0 ? "indeterminate" : false} onCheckedChange={checked => setSelected(checked === true ? new Set(matches.map(row => row.promo_id)) : new Set())} /></TableHead>
                <TableHead>Promo</TableHead><TableHead>Current venue name</TableHead><TableHead>Link to venue</TableHead>
              </TableRow></TableHeader>
              <TableBody>{matches.map(row => <TableRow key={row.promo_id}>
                <TableCell><Checkbox aria-label={`Select ${row.promo_title}`} checked={selected.has(row.promo_id)} onCheckedChange={checked => setSelected(previous => {
                  const next = new Set(previous);
                  if (checked === true) next.add(row.promo_id); else next.delete(row.promo_id);
                  return next;
                })} /></TableCell>
                <TableCell className="min-w-40 max-w-80 whitespace-normal break-words">{row.promo_title}</TableCell>
                <TableCell className="whitespace-normal break-words">{row.current_venue_name}</TableCell>
                <TableCell className="whitespace-normal break-words">{row.matched_venue_name}</TableCell>
              </TableRow>)}</TableBody>
            </Table>
          )}
        </div>
      )}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link {selected.size} promos to venues?</AlertDialogTitle>
            <AlertDialogDescription>These promos will use the selected venues’ names and locations. Existing valid links and matches that have changed will be left untouched.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={applyRepairs}>Confirm links</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {checkedAt && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="secondary">{results.filter(row => row.kind === "promo").length} promos</Badge>
            <Badge variant="secondary">{results.filter(row => row.kind === "event").length} events</Badge>
            <span className="text-muted-foreground">Last checked: {checkedAt.toLocaleTimeString()}</span>
          </div>
          {results.length === 0 ? <p role="status" className="text-sm text-muted-foreground">All promos and events are linked to existing venues.</p> : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs value={filter} onValueChange={setFilter}>
                  <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="promo">Promos</TabsTrigger><TabsTrigger value="event">Events</TabsTrigger></TabsList>
                </Tabs>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input aria-label="Search unlinked content" placeholder="Search title or venue" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Title</TableHead><TableHead>Venue name</TableHead><TableHead>Issue</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {visible.map(row => (
                    <TableRow key={`${row.kind}-${row.id}`}>
                      <TableCell>{row.kind === "promo" ? "Promo" : "Event"}</TableCell>
                      <TableCell className="min-w-40 max-w-80 whitespace-normal break-words font-medium">{row.title}</TableCell>
                      <TableCell className="max-w-60 whitespace-normal break-words">{row.venue_name || "—"}</TableCell>
                      <TableCell>{row.venue_id ? "Venue no longer exists" : "No venue linked"}</TableCell>
                      <TableCell><div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost"><Link to={row.kind === "promo" ? getPromoUrl(row) : getEventUrl(row)} target="_blank" rel="noopener noreferrer" aria-label={`View ${row.title}`} title="View"><ExternalLink className="h-4 w-4" /></Link></Button>
                        <Button asChild size="icon" variant="outline"><Link to={row.kind === "promo" ? getEditPromoUrl(row) : getEditEventUrl(row)} target="_blank" rel="noopener noreferrer" aria-label={`Edit ${row.title}`} title="Edit venue link"><Pencil className="h-4 w-4" /></Link></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                  {visible.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No matching promos or events.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </>
          )}
        </>
      )}
    </section>
  );
};