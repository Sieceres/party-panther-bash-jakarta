// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://partypanther.net";
const SUPABASE_URL = "https://qgttbaibhmzbmknjlghj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndHRiYWliaG16Ym1rbmpsZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzAyODAsImV4cCI6MjA2NTUwNjI4MH0.jChcXNsowGgb4dz1WTnoTWrBPTK8HeZsUjQA1Mhe5gc";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/events", changefreq: "daily", priority: "0.9" },
  { path: "/promos", changefreq: "daily", priority: "0.9" },
  { path: "/venues", changefreq: "daily", priority: "0.8" },
  { path: "/map", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/terms-conditions", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toEntry(path: string, updated?: string | null, priority = "0.7"): SitemapEntry {
  return {
    path,
    lastmod: updated ? new Date(updated).toISOString().slice(0, 10) : undefined,
    changefreq: "weekly",
    priority,
  };
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const entries: SitemapEntry[] = [...staticEntries];

  try {
    const { data: events } = await supabase
      .from("events")
      .select("slug, id, updated_at")
      .limit(5000);
    for (const e of events ?? []) {
      entries.push(toEntry(`/e/${e.slug || e.id}`, e.updated_at, "0.8"));
    }

    const { data: promos } = await supabase
      .from("promos")
      .select("slug, id, updated_at")
      .limit(5000);
    for (const p of promos ?? []) {
      entries.push(toEntry(`/p/${p.slug || p.id}`, p.updated_at, "0.8"));
    }

    const { data: venues } = await supabase
      .from("venues")
      .select("slug, id, updated_at")
      .limit(5000);
    for (const v of venues ?? []) {
      entries.push(toEntry(`/v/${v.slug || v.id}`, v.updated_at, "0.7"));
    }
  } catch (err) {
    console.warn("sitemap: failed to fetch dynamic entries, continuing with static only", err);
  }

  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main().catch((err) => {
  console.error("sitemap generation failed:", err);
  process.exit(0); // don't break the build
});