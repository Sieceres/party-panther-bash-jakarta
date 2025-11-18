import { useEffect, useRef, useState } from "react";

interface Props {
  postUrl?: string | null;
  maxWidth?: number | string;
}

// Normalize and clean incoming instagram values into full permalink like:
// https://www.instagram.com/p/DQVw_Huj4Fq/
function normalizeInstagramPermalink(input?: string | null) {
  if (!input) return null;
  const trimmed = String(input).trim();
  // strip query and fragment
  const withoutQuery = trimmed.split(/[?#]/)[0];
  // if only shortcode (alphanumeric, - or _), build permalink
  if (/^[A-Za-z0-9_-]+$/.test(withoutQuery)) {
    return `https://www.instagram.com/p/${withoutQuery}/`;
  }
  // ensure it starts with protocol and ends with one slash
  const hasProtocol = /^https?:\/\//i.test(withoutQuery) ? withoutQuery : `https://${withoutQuery}`;
  return hasProtocol.endsWith("/") ? hasProtocol : `${hasProtocol}/`;
}

export default function InstagramEmbed({ postUrl, maxWidth = 540 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [oembedHtml, setOembedHtml] = useState<string | null>(null);
  const permalink = normalizeInstagramPermalink(postUrl);

  // Load Instagram embed script once
  useEffect(() => {
    if (!permalink) return;
    if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
      const s = document.createElement("script");
      s.src = "https://www.instagram.com/embed.js";
      s.async = true;
      s.onload = () => { /* processed below */ };
      s.onerror = () => console.warn("Instagram embed script failed to load");
      document.body.appendChild(s);
    }
  }, [permalink]);

  // Optional: try to fetch server-side cached oEmbed from /api/instagram-oembed if you implement it
  useEffect(() => {
    let mounted = true;
    async function fetchOembed() {
      if (!permalink) return;
      try {
        const res = await fetch(`/api/instagram-oembed?url=${encodeURIComponent(permalink)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        if (json?.html) setOembedHtml(json.html);
      } catch (err) {
        // fallback to blockquote if server oEmbed not available
        console.debug("instagram oembed fetch failed, falling back to blockquote", err);
      }
    }
    fetchOembed();
    return () => { mounted = false; };
  }, [permalink]);

  // Ensure instgrm processes the embed (works for both blockquote fallback and injected oEmbed HTML)
  useEffect(() => {
    if (!permalink) return;
    const process = () => {
      try {
        const w = window as any;
        if (w.instgrm?.Embeds?.process) w.instgrm.Embeds.process();
        else if (typeof w.instgrm?.process === "function") w.instgrm.process();
      } catch (err) {
        console.debug("instagram process error", err);
      }
    };

    if (oembedHtml && containerRef.current) {
      containerRef.current.innerHTML = oembedHtml;
      process();
      return;
    }

    process();
    const interval = setInterval(process, 700);
    const observer = new MutationObserver(process);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [permalink, oembedHtml]);

  if (!permalink) return null;

  return (
    <div className="my-8 flex justify-center">
      <div
        ref={containerRef}
        style={{ maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth, width: "100%" }}
      >
        {oembedHtml ? null : (
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={permalink}
            data-instgrm-version="14"
            style={{ maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth, width: "100%" }}
          >
            <a href={permalink}>View on Instagram</a>
          </blockquote>
        )}
      </div>
    </div>
  );
}
