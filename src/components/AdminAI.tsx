import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Square, Sparkles, ExternalLink, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getEventUrl, getPromoUrl, getVenueUrl } from "@/lib/slug-utils";

type Result = { entity: "venues" | "promos" | "events"; explanation: string; total: number; supported: boolean; rows: Record<string, unknown>[] };
type Entry = { question: string; result?: Result; error?: string };
const prompts = ["Show me venues with Instagram but no promos", "Show me venues without WhatsApp", "Show me unlinked promos", "Show me upcoming events with registration enabled"];

function Results({ result }: { result: Result }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(result.rows.length / 25);
  const url = result.entity === "venues" ? getVenueUrl : result.entity === "promos" ? getPromoUrl : getEventUrl;
  return <div className="space-y-3">
    <p className="whitespace-pre-line break-words">{result.explanation}</p>
    {result.supported && <Badge variant="secondary">{result.total} {result.entity}</Badge>}
    {result.supported && result.total === 0 && <p className="text-muted-foreground">No matching records.</p>}
    <div className="divide-y divide-border">
      {result.rows.slice(page * 25, (page + 1) * 25).map(row => <div key={String(row.id)} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0 flex-1"><Link to={url(row)} className="font-medium text-link hover:underline break-words">{String(row.name || row.title)}</Link>
          <p className="text-sm text-muted-foreground break-words">{[row.area, row.venue_name, row.date].filter(Boolean).map(String).join(" · ")}</p>
          {result.entity === "venues" && <p className="text-sm text-muted-foreground">{String(row.promo_count)} promos · {String(row.event_count)} events</p>}
        </div>
        <div className="flex items-center gap-2">
          {typeof row.instagram === "string" && row.instagram.trim() && <Button size="sm" variant="outline" asChild><a href={`https://www.instagram.com/${row.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").split(/[/?#]/)[0]}/`} target="_blank" rel="noopener noreferrer">Instagram <ExternalLink className="ml-2 h-3 w-3" /></a></Button>}
          <Button size="sm" variant="outline" asChild><Link to={url(row)}>Open</Link></Button>
        </div>
      </div>)}
    </div>
    {pages > 1 && <div className="flex items-center justify-end gap-3"><Button variant="ghost" size="icon" aria-label="Previous results" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft /></Button><span className="text-sm">{page + 1} / {pages}</span><Button variant="ghost" size="icon" aria-label="Next results" disabled={page + 1 === pages} onClick={() => setPage(p => p + 1)}><ChevronRight /></Button></div>}
  </div>;
}

export function AdminAI() {
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [thinking, setThinking] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function ask(text = question) {
    if (!text.trim() || busy) return;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); setStatus("Thinking…"); setThinking(""); setQuestion("");
    const index = entries.length;
    setEntries(previous => [...previous, { question: text }]);
    const update = (patch: Partial<Entry>) => setEntries(previous => previous.map((entry, i) => i === index ? { ...entry, ...patch } : entry));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ question: text, context: entries.filter(e => e.result).slice(-20).map(e => ({ question: e.question, explanation: e.result?.explanation || "" })) }), signal: abort.signal });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || `Request failed (${response.status}).`); }
      if (!response.body) throw new Error("The AI response was empty.");
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let buffer = "", completed = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
          if (!event.startsWith("data: ")) continue;
          const data = JSON.parse(event.slice(6));
          if (data.type === "thinking") setThinking(previous => previous + data.text);
          if (data.type === "status") setStatus(data.text);
          if (data.type === "error") throw new Error(data.message);
          if (data.type === "result") { completed = true; update({ result: data }); }
        }
      }
      if (!completed) throw new Error("The response ended without results.");
    } catch (error) {
      update({ error: abort.signal.aborted ? "Stopped." : error instanceof Error ? error.message : "Could not complete the question." });
      setQuestion(text);
    } finally { setBusy(false); controller.current = null; setStatus(""); }
  }
  return <section className="mx-auto max-w-5xl space-y-6 py-4">
    <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="h-5 w-5 text-link" /> AI Assistant</h2><Button variant="ghost" size="icon" aria-label="Clear conversation" title="Clear conversation" disabled={busy || entries.length === 0} onClick={() => { setEntries([]); setThinking(""); }}><RotateCcw className="h-4 w-4" /></Button></div>
    {entries.length === 0 && <div className="flex flex-wrap gap-2">{prompts.map(prompt => <Button key={prompt} variant="outline" className="h-auto whitespace-normal text-left py-2" onClick={() => ask(prompt)}>{prompt}</Button>)}</div>}
    <div className="space-y-6" aria-live="polite">{entries.map((entry, i) => <article key={i} className="space-y-4 border-b border-border pb-6"><h3 className="font-semibold break-words whitespace-pre-line">{entry.question}</h3>{entry.result && <Results result={entry.result} />}{entry.error && <p role="alert" className="text-destructive break-words">{entry.error}</p>}</article>)}</div>
    {busy && <div role="status" className="text-muted-foreground space-y-2"><p>{status}</p>{thinking && <details><summary className="cursor-pointer text-sm">Thinking</summary><p className="text-sm whitespace-pre-line break-words py-2">{thinking}</p></details>}</div>}
    <form onSubmit={event => { event.preventDefault(); ask(); }} className="flex items-end gap-2">
      <Textarea aria-label="Ask about venues, promos or events" placeholder="Ask about venues, promos or events…" value={question} onChange={event => setQuestion(event.target.value)} autoResize disabled={busy} />
      {busy ? <Button type="button" size="icon" variant="outline" aria-label="Stop" title="Stop" onClick={() => controller.current?.abort()}><Square className="h-4 w-4" /></Button> : <Button type="submit" size="icon" aria-label="Send question" title="Send question" disabled={!question.trim()}><ArrowUp className="h-5 w-5" /></Button>}
    </form>
  </section>;
}