import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, ChevronDown, ChevronRight, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isStale } from "@/lib/kam";
import { toast } from "@/lib/toast";

interface Row {
  id: string;
  name: string;
  slug: string | null;
  area: string | null;
  last_checked_at: string | null;
  promoCount: number;
  promos: PromoRow[];
}

interface PromoRow {
  id: string;
  title: string;
  slug: string | null;
  last_confirmed_at: string | null;
}

const norm = (n: string | null | undefined) =>
  (n || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/^\s*the\s+/, "").replace(/\s+/g, " ").trim();

export function MyVenuesSection({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: venues } = await (supabase.from("venues") as any)
      .select("id, name, slug, area, last_checked_at")
      .eq("kam_id", userId)
      .order("name");
    const ids = (venues || []).map((v: any) => v.id);
    const { data: promos } = ids.length
      ? await (supabase.from("promos") as any).select("id, title, slug, venue_id, venue_name, last_confirmed_at").order("title")
      : { data: [] as any[] };
    setRows(
      ((venues as any[]) || []).map((v) => {
        const list: PromoRow[] = ((promos as any[]) || []).filter(
          (p) => p.venue_id === v.id || (!p.venue_id && norm(p.venue_name) === norm(v.name)),
        );
        return { ...v, promos: list, promoCount: list.length };
      }),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const markChecked = async (id: string) => {
    const { error } = await supabase.from("venues").update({ last_checked_at: new Date().toISOString() } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as checked");
    load();
  };

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const confirmPromo = async (promo: PromoRow) => {
    setBusy(promo.id);
    const { data, error } = await (supabase.rpc as any)("confirm_promo", { _promo_id: promo.id });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Confirmed "${promo.title}"`);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        promos: r.promos.map((p) => (p.id === promo.id ? { ...p, last_confirmed_at: data as string } : p)),
      })),
    );
  };

  const staleCount = rows.filter((r) => isStale(r.last_checked_at)).length;

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Building2 className="w-5 h-5 text-primary" /> My venues
          <Badge variant="secondary">{rows.length}</Badge>
          {staleCount > 0 && <Badge variant="destructive">{staleCount} need checking</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No venues assigned to you yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {[...rows]
              .sort((a, b) => Number(isStale(b.last_checked_at)) - Number(isStale(a.last_checked_at)))
              .map((r) => (
                <div key={r.id} className="py-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={open[r.id] ? "Hide promos" : "Show promos"}
                    onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={r.promoCount === 0}
                  >
                    {open[r.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link to={`/venue/${r.slug || r.id}`} className="font-medium hover:text-primary truncate block">
                      {r.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {r.area || "No area"} · {r.promoCount} promos ·{" "}
                      {r.last_checked_at ? `checked ${new Date(r.last_checked_at).toLocaleDateString()}` : "never checked"}
                    </div>
                  </div>
                  {isStale(r.last_checked_at) && <Badge variant="destructive">Outdated</Badge>}
                  <Button size="sm" variant="outline" onClick={() => markChecked(r.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Checked
                  </Button>
                </div>
                {open[r.id] && r.promos.length > 0 && (
                  <div className="ml-7 mt-2 space-y-1">
                    {r.promos.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
                        <div className="flex-1 min-w-0">
                          <Link to={`/promo/${p.slug || p.id}`} className="text-sm hover:text-primary truncate block">
                            {p.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {p.last_confirmed_at
                              ? `confirmed ${new Date(p.last_confirmed_at).toLocaleDateString()}`
                              : "never confirmed"}
                          </div>
                        </div>
                        {isStale(p.last_confirmed_at) && <Badge variant="destructive">Outdated</Badge>}
                        <Button size="sm" disabled={busy === p.id} onClick={() => confirmPromo(p)}>
                          <BadgeCheck className="w-4 h-4 mr-1" /> CONFIRM
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
