import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { registration_id } = await req.json().catch(() => ({}));
    if (typeof registration_id !== "string" || !/^[0-9a-f-]{36}$/i.test(registration_id)) {
      return json({ error: "Invalid registration_id" }, 400);
    }
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) return json({ skipped: "email not configured" });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Claim the row once so a registration is only ever emailed one time
    const { data: reg } = await admin
      .from("event_registrations")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", registration_id)
      .is("email_sent_at", null)
      .gte("created_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .select("id, event_id, respondent_name, respondent_email, answers, fields_snapshot, created_at")
      .maybeSingle();
    if (!reg) return json({ skipped: "already sent or not found" });

    const { data: ev } = await admin
      .from("events")
      .select("title, slug, created_by, registration_fields")
      .eq("id", reg.event_id)
      .single();
    if (!ev?.created_by) return json({ skipped: "no organizer" });

    const { data: owner } = await admin.auth.admin.getUserById(ev.created_by);
    const to = owner?.user?.email;
    if (!to) return json({ skipped: "organizer has no email" });

    const { count } = await admin
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", reg.event_id);

    const fields = ((reg as any).fields_snapshot as any[]) || (ev.registration_fields as any[]) || [];
    const rows = fields
      .map((f) => {
        const v = reg.answers?.[f.id];
        const val = Array.isArray(v) ? v.join(", ") : v ?? "";
        return `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(f.label)}</td><td style="padding:4px 0">${esc(val) || "—"}</td></tr>`;
      })
      .join("");
    const link = `https://partypanther.lovable.app/event/${encodeURIComponent(ev.slug || reg.event_id)}`;
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
      <h2 style="margin:0 0 8px">New registration for ${esc(ev.title)}</h2>
      <p style="margin:0 0 16px">${esc(reg.respondent_name)} (${esc(reg.respondent_email)}) just registered. You now have ${count ?? 1} registration(s).</p>
      <table style="border-collapse:collapse">${rows}</table>
      <p style="margin-top:20px"><a href="${link}" style="background:#00CFFF;color:#000;padding:10px 16px;border-radius:6px;text-decoration:none">View all registrations</a></p>
    </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") || "Party Panther <admin@partypanther.net>",
        to: [to],
        reply_to: reg.respondent_email || undefined,
        subject: `New registration: ${ev.title}`,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend failed [${res.status}]: ${body}`);
      await admin.from("event_registrations").update({ email_sent_at: null }).eq("id", reg.id);
      return json({ error: "Email failed", status: res.status, details: body }, 502);
    }
    return json({ sent: true });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
