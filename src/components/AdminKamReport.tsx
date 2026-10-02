import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { KamUser } from "@/lib/kam";

interface Activity {
  id: string;
  kam_id: string;
  action: string;
  promo_id: string | null;
  details: any;
  created_at: string;
}

export interface KamPromoStats {
  [kamId: string]: { total: number; upToDate: number };
}

const DAY = 86400000;

export function AdminKamReport({ kams, promoStats }: { kams: KamUser[]; promoStats: KamPromoStats }) {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [days, setDays] = useState("30");
  const [kamFilter, setKamFilter] = useState("all");

  useEffect(() => {
    const since = new Date(Date.now() - Number(days) * DAY).toISOString();
    (supabase.from("kam_activity" as any) as any)
      .select("id, kam_id, action, promo_id, details, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data }: any) => setActivity(data || []));
  }, [days]);

  const name = (id: string) => kams.find((k) => k.user_id === id)?.display_name || "Unknown";

  const rows = useMemo(
    () =>
      kams.map((k) => {
        const mine = activity.filter((a) => a.kam_id === k.user_id);
        const week = mine.filter((a) => Date.now() - new Date(a.created_at).getTime() < 7 * DAY).length;
        const s = promoStats[k.user_id] || { total: 0, upToDate: 0 };
        return {
          ...k,
          confirmations: mine.length,
          week,
          lastActive: mine[0]?.created_at || null,
          total: s.total,
          upToDate: s.upToDate,
          pct: s.total ? Math.round((s.upToDate / s.total) * 100) : 0,
        };
      }),
    [kams, activity, promoStats],
  );

  const feed = activity.filter((a) => kamFilter === "all" || a.kam_id === kamFilter).slice(0, 100);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <CardTitle>KAM activity report</CardTitle>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">KAM</th>
                <th className="py-2 pr-3">Confirmed (period)</th>
                <th className="py-2 pr-3">Last 7 days</th>
                <th className="py-2 pr-3">Promos up to date</th>
                <th className="py-2 pr-3">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="py-2 pr-3 font-medium">{r.display_name}</td>
                  <td className="py-2 pr-3">{r.confirmations}</td>
                  <td className="py-2 pr-3">{r.week}</td>
                  <td className="py-2 pr-3">
                    <span className={r.pct < 50 ? "text-destructive" : ""}>{r.upToDate}/{r.total} ({r.pct}%)</span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {r.lastActive ? new Date(r.lastActive).toLocaleString() : "No activity"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="font-semibold">Recent activity</h3>
            <Select value={kamFilter} onValueChange={setKamFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KAMs</SelectItem>
                {kams.map((k) => <SelectItem key={k.user_id} value={k.user_id}>{k.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity in this period.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {feed.map((a) => (
                <li key={a.id} className="py-1.5 flex justify-between gap-3">
                  <span>
                    <span className="font-medium">{name(a.kam_id)}</span> confirmed{" "}
                    <span className="text-primary">{a.details?.title || "a promo"}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
