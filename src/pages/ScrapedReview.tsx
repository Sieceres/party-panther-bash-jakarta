import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Check, X, ExternalLink, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ScrapedItem = {
  id: string;
  source: string;
  source_url: string | null;
  item_type: "event" | "promo";
  raw_data: any;
  status: string;
  created_at: string;
};

const SOURCES = [
  { id: "indoparty", name: "IndoParty" },
  { id: "tan_delulu", name: "TAN – Delulu" },
  { id: "vault", name: "Vault" },
  { id: "hop", name: "See You at the Hop" },
  { id: "pats", name: "Pat's X" },
  { id: "t5", name: "Classic T5" },
];

export default function ScrapedReview() {
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pending_scraped_items")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data || []) as ScrapedItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScrape = async (sources?: string[]) => {
    setScraping(true);
    const { data, error } = await supabase.functions.invoke("scrape-jakarta-sources", {
      body: sources ? { sources } : {},
    });
    setScraping(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Scrape complete");
    console.log("scrape summary", data);
    load();
  };

  const reject = async (id: string) => {
    const { error } = await supabase
      .from("pending_scraped_items")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const approveEvent = async (item: ScrapedItem) => {
    const d = item.raw_data || {};
    const { data: user } = await supabase.auth.getUser();
    const payload: any = {
      title: d.title || "Untitled",
      description: d.description || null,
      date: d.date || new Date().toISOString().slice(0, 10),
      time: d.time || "20:00",
      venue_name: d.venue_name || null,
      venue_address: d.venue_address || null,
      organizer_name: d.organizer_name || item.source,
      organizer_whatsapp: d.organizer_whatsapp || null,
      price_currency: "IDR",
      created_by: user.user?.id,
    };
    const { data: ev, error } = await supabase.from("events").insert(payload).select("id, slug").single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("pending_scraped_items")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), created_id: ev.id })
      .eq("id", item.id);
    toast.success("Event created");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const approvePromo = async (item: ScrapedItem) => {
    const d = item.raw_data || {};
    const { data: user } = await supabase.auth.getUser();
    const payload: any = {
      title: d.title || "Untitled",
      description: d.description || null,
      discount_text: d.discount_text || "See details",
      venue_name: d.venue_name || item.source,
      venue_address: d.venue_address || null,
      promo_type: d.promo_type || "Other",
      day_of_week: d.day_of_week || null,
      drink_type: d.drink_type || null,
      price_currency: "IDR",
      created_by: user.user?.id,
    };
    const { data: pr, error } = await supabase.from("promos").insert(payload).select("id, slug").single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("pending_scraped_items")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), created_id: pr.id })
      .eq("id", item.id);
    toast.success("Promo created");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Scraped Jakarta Sources</h1>
        <div className="flex gap-2">
          <Button onClick={() => load()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Reload
          </Button>
          <Button onClick={() => runScrape()} disabled={scraping}>
            {scraping ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Scrape All
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <Button key={s.id} size="sm" variant="outline" disabled={scraping} onClick={() => runScrape([s.id])}>
            {s.name}
          </Button>
        ))}
      </div>

      {loading && <Loader2 className="w-6 h-6 animate-spin" />}

      {!loading && items.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No pending items. Try scraping.</CardContent></Card>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const d = item.raw_data || {};
          return (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant={item.item_type === "event" ? "default" : "secondary"}>{item.item_type}</Badge>
                    {d.title || "(no title)"}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {item.source}
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center hover:underline">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  {d.venue_name && <div><b>Venue:</b> {d.venue_name}</div>}
                  {d.date && <div><b>Date:</b> {d.date} {d.time}</div>}
                  {d.discount_text && <div><b>Deal:</b> {d.discount_text}</div>}
                  {d.day_of_week?.length > 0 && <div><b>Days:</b> {d.day_of_week.join(", ")}</div>}
                  {d.description && <div className="text-muted-foreground line-clamp-3">{d.description}</div>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => item.item_type === "event" ? approveEvent(item) : approvePromo(item)}>
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject(item.id)}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
