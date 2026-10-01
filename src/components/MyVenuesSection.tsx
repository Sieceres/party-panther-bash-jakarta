import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2 } from "lucide-react";
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
}

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
      ? await supabase.from("promos").select("venue_id").in("venue_id", ids)
      : { data: [] as any[] };
    setRows(
      ((venues as any[]) || []).map((v) => ({
        ...v,
        promoCount: (promos || []).filter((p: any) => p.venue_id === v.id).length,
      })),
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
                <div key={r.id} className="py-2 flex items-center gap-3">
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
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
