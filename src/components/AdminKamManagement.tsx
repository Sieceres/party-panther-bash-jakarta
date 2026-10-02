import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw, Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { distributeVenues, fetchKamUsers, isStale, KamUser } from "@/lib/kam";
import { toast } from "@/lib/toast";
import { AdminKamReport, KamPromoStats } from "./AdminKamReport";

interface Row {
  id: string;
  name: string;
  slug: string | null;
  area: string | null;
  kam_id: string | null;
  last_checked_at: string | null;
  promoCount: number;
  upToDate: number;
}

const UNASSIGNED = "__none__";

export function AdminKamManagement() {
  const [kams, setKams] = useState<KamUser[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [kamFilter, setKamFilter] = useState("all");
  const [onlyWithPromos, setOnlyWithPromos] = useState(true);
  const [keepExisting, setKeepExisting] = useState(true);

  const load = async () => {
    setLoading(true);
    const [k, { data: venues }, { data: promos }] = await Promise.all([
      fetchKamUsers(),
      supabase.from("venues").select("id, name, slug, area, kam_id, last_checked_at").order("name").range(0, 4999),
      supabase.from("promos").select("venue_id, venue_name, last_confirmed_at").range(0, 9999),
    ]);
    // Many promos are only linked by venue name, so match by id first, then by name
    const norm = (s: string | null | undefined) => (s || "").toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]/g, "");
    const byName: Record<string, string> = {};
    ((venues as any[]) || []).forEach((v) => { byName[norm(v.name)] = v.id; });
    const counts: Record<string, number> = {};
    const fresh: Record<string, number> = {};
    (promos || []).forEach((p: any) => {
      const id = p.venue_id || byName[norm(p.venue_name)];
      if (!id) return;
      counts[id] = (counts[id] || 0) + 1;
      if (!isStale(p.last_confirmed_at)) fresh[id] = (fresh[id] || 0) + 1;
    });
    setKams(k);
    setRows(((venues as any[]) || []).map((v) => ({ ...v, promoCount: counts[v.id] || 0, upToDate: fresh[v.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const distribute = async () => {
    if (!kams.length) return toast.error("No Key Account Managers found");
    setBusy(true);
    try {
      const kamIds = kams.map((k) => k.user_id);
      const target = rows.filter((r) => (!onlyWithPromos || r.promoCount > 0) && (!keepExisting || !r.kam_id));
      if (!target.length) { toast.success("Nothing to assign"); return; }
      const existing = keepExisting ? rows.filter((r) => r.kam_id) : [];
      const map = distributeVenues(
        target.map((r) => ({ id: r.id, area: r.area, promoCount: r.promoCount })),
        kamIds,
        existing as any,
      );
      // group by KAM to minimise requests
      const byKam: Record<string, string[]> = {};
      Object.entries(map).forEach(([v, k]) => { (byKam[k] ||= []).push(v); });
      for (const [k, ids] of Object.entries(byKam)) {
        for (let i = 0; i < ids.length; i += 200) {
          const { error } = await supabase.from("venues").update({ kam_id: k } as any).in("id", ids.slice(i, i + 200));
          if (error) throw error;
        }
      }
      toast.success(`${target.length} venues distributed`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Distribution failed");
    } finally {
      setBusy(false);
    }
  };

  const resetDistribution = async () => {
    const assigned = rows.filter((r) => r.kam_id);
    if (!assigned.length) { toast.info("No venues are assigned"); return; }
    setBusy(true);
    try {
      const ids = assigned.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await supabase.from("venues").update({ kam_id: null } as any).in("id", ids.slice(i, i + 200));
        if (error) throw error;
      }
      toast.success(`${assigned.length} venues unassigned`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  const changeKam = async (venueId: string, value: string) => {
    const kam_id = value === UNASSIGNED ? null : value;
    const { error } = await supabase.from("venues").update({ kam_id } as any).eq("id", venueId);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((r) => (r.id === venueId ? { ...r, kam_id } : r)));
  };

  const summary = useMemo(
    () =>
      kams.map((k) => {
        const mine = rows.filter((r) => r.kam_id === k.user_id);
        return {
          ...k,
          venues: mine.length,
          promos: mine.reduce((s, r) => s + r.promoCount, 0),
          stale: mine.filter((r) => r.upToDate < r.promoCount).length,
        };
      }),
    [kams, rows],
  );
  const promoStats = useMemo(() => {
    const out: KamPromoStats = {};
    rows.forEach((r) => {
      if (!r.kam_id) return;
      const s = (out[r.kam_id] ||= { total: 0, upToDate: 0 });
      s.total += r.promoCount;
      s.upToDate += r.upToDate;
    });
    return out;
  }, [rows]);
  const unassigned = rows.filter((r) => !r.kam_id).length;

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (kamFilter === "all" || (kamFilter === UNASSIGNED ? !r.kam_id : r.kam_id === kamFilter)),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>Key Account Managers</CardTitle>
          <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={busy || loading}>
                <Shuffle className="w-4 h-4 mr-2" /> {busy ? "Distributing…" : "Auto-distribute venues"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Redistribute all venues?</AlertDialogTitle>
                <AlertDialogDescription>
                  Venues are shared evenly between {kams.length} KAMs, balancing promo counts and keeping areas together.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox checked={onlyWithPromos} onCheckedChange={(v) => setOnlyWithPromos(!!v)} />
                  Only venues with promos ({rows.filter((r) => r.promoCount > 0).length})
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox checked={keepExisting} onCheckedChange={(v) => setKeepExisting(!!v)} />
                  Keep existing assignments (only assign unassigned venues)
                </label>
                <p className="text-muted-foreground">
                  {rows.filter((r) => (!onlyWithPromos || r.promoCount > 0) && (!keepExisting || !r.kam_id)).length} venues will be assigned
                  {!keepExisting && " — all current assignments for these venues are replaced"}.
                </p>
              </div>
              <AlertDialogHeader className="hidden">
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={distribute}>Distribute</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={busy || loading || !rows.some((r) => r.kam_id)}>
                <RotateCcw className="w-4 h-4 mr-2" /> Reset distribution
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset the distribution?</AlertDialogTitle>
                <AlertDialogDescription>
                  All {rows.filter((r) => r.kam_id).length} assigned venues will lose their KAM. You can run "Auto-distribute venues" again to start fresh.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetDistribution}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {summary.map((s) => (
              <div key={s.user_id} className="rounded-md border border-border p-3">
                <div className="font-medium truncate">{s.display_name}</div>
                <div className="text-xs text-muted-foreground">{s.venues} venues · {s.promos} promos</div>
                {s.stale > 0 && <Badge variant="destructive" className="mt-1">{s.stale} outdated</Badge>}
              </div>
            ))}
            <div className="rounded-md border border-dashed border-border p-3">
              <div className="font-medium">Unassigned</div>
              <div className="text-xs text-muted-foreground">{unassigned} venues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && <AdminKamReport kams={kams} promoStats={promoStats} />}

      <Card>
        <CardHeader className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <CardTitle>Venue assignments</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="Search venue…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
            <Select value={kamFilter} onValueChange={setKamFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KAMs</SelectItem>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {kams.map((k) => <SelectItem key={k.user_id} value={k.user_id}>{k.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((r) => (
                <div key={r.id} className="py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/venue/${r.slug || r.id}`} className="font-medium hover:text-primary truncate block">{r.name}</Link>
                    <div className="text-xs text-muted-foreground">
                      {r.area || "No area"} · {r.promoCount} promos
                      {r.upToDate < r.promoCount && " · outdated"}
                    </div>
                  </div>
                  <Select value={r.kam_id || UNASSIGNED} onValueChange={(v) => changeKam(r.id, v)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {kams.map((k) => <SelectItem key={k.user_id} value={k.user_id}>{k.display_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
