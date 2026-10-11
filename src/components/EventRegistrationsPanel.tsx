import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { RegField, formatAnswer, isChoice } from "@/lib/registration";

interface Registration {
  id: string;
  respondent_name: string | null;
  respondent_email: string | null;
  answers: Record<string, any>;
  user_id: string | null;
  created_at: string;
}

interface Props {
  eventId: string;
  eventTitle: string;
  fields: RegField[];
  capacity: number | null;
}

export function EventRegistrationsPanel({ eventId, eventTitle, fields, capacity }: Props) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await (supabase.from("event_registrations" as any) as any)
      .select("id, respondent_name, respondent_email, answers, user_id, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, [eventId]);

  const perDay = useMemo(() => {
    const m: Record<string, number> = {};
    [...rows].reverse().forEach((r) => {
      const d = new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      m[d] = (m[d] || 0) + 1;
    });
    return Object.entries(m).map(([day, count]) => ({ day, count }));
  }, [rows]);

  const breakdowns = useMemo(
    () =>
      fields.filter((f) => isChoice(f.type)).map((f) => {
        const counts: Record<string, number> = Object.fromEntries((f.options || []).map((o) => [o, 0]));
        rows.forEach((r) => {
          const v = r.answers?.[f.id];
          (Array.isArray(v) ? v : v ? [v] : []).forEach((x: string) => { counts[x] = (counts[x] || 0) + 1; });
        });
        return { field: f, data: Object.entries(counts).map(([option, count]) => ({ option, count })) };
      }),
    [fields, rows],
  );

  const last7 = rows.filter((r) => Date.now() - new Date(r.created_at).getTime() < 7 * 86400000).length;
  const withAccount = rows.filter((r) => r.user_id).length;

  const exportXls = () => {
    const data = rows.map((r) => {
      const o: Record<string, any> = {
        "Registered at": new Date(r.created_at).toLocaleString(),
        Name: r.respondent_name,
        Email: r.respondent_email,
        "Has account": r.user_id ? "Yes" : "No",
      };
      fields.forEach((f) => { o[f.label] = formatAnswer(r.answers?.[f.id]); });
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, `registrations-${eventTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.xlsx`);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    const { error } = await (supabase.from("event_registrations" as any) as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Registration deleted");
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" /> Registrations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-border p-2">
            <div className="text-xl font-bold">{rows.length}{capacity ? <span className="text-sm text-muted-foreground">/{capacity}</span> : null}</div>
            <div className="text-[11px] text-muted-foreground">Total</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-xl font-bold">{last7}</div>
            <div className="text-[11px] text-muted-foreground">Last 7 days</div>
          </div>
          <div className="rounded-md border border-border p-2">
            <div className="text-xl font-bold">{withAccount}</div>
            <div className="text-[11px] text-muted-foreground">With account</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={() => setOpen(true)}>Responses & stats</Button>
          <Button variant="outline" size="icon" aria-label="Export to spreadsheet" onClick={exportXls} disabled={!rows.length}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrations for {eventTitle}</DialogTitle></DialogHeader>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Sign-ups per day</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perDay}>
                      <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {breakdowns.map(({ field, data }) => (
                <div key={field.id}>
                  <h3 className="font-semibold mb-2">{field.label}</h3>
                  <div className="space-y-1.5">
                    {data.map((d) => {
                      const pct = rows.length ? Math.round((d.count / rows.length) * 100) : 0;
                      return (
                        <div key={d.option} className="text-sm">
                          <div className="flex justify-between"><span>{d.option}</span><span className="text-muted-foreground">{d.count} ({pct}%)</span></div>
                          <div className="h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">All responses</h3>
                  <Button size="sm" variant="outline" onClick={exportXls}><Download className="w-4 h-4 mr-1" /> Export</Button>
                </div>
                <div className="space-y-2">
                  {rows.map((r) => (
                    <div key={r.id} className="rounded-md border border-border p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <div>
                          <div className="font-medium">{r.respondent_name}</div>
                          <div className="text-muted-foreground text-xs">{r.respondent_email} · {new Date(r.created_at).toLocaleString()}</div>
                        </div>
                        <Button variant="ghost" size="icon" aria-label="Delete registration" onClick={() => remove(r.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {fields.length > 0 && (
                        <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {fields.map((f) => (
                            <div key={f.id}>
                              <dt className="text-xs text-muted-foreground">{f.label}</dt>
                              <dd className="break-words">{formatAnswer(r.answers?.[f.id]) || "—"}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
