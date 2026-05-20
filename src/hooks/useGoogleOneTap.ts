import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const GOOGLE_CLIENT_ID = "900992276408-mmaa6o6t4dom10rm3b6r9tvin4jcgdu0.apps.googleusercontent.com";

// Window.google is declared as `typeof google` elsewhere via @types/google.maps.

async function sha256Base64(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function waitForGoogle(timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const g = (window as any).google;
      if (g?.accounts?.id) return resolve(g);
      if (Date.now() - start > timeoutMs) return reject(new Error("Google Identity Services failed to load"));
      setTimeout(tick, 100);
    };
    tick();
  });
}

interface Options {
  enabled: boolean;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export function useGoogleOneTap({ enabled, onSuccess, onError }: Options) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nonceRef = useRef<{ raw: string; hashed: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const raw = crypto.randomUUID();
        const hashed = await sha256Base64(raw);
        nonceRef.current = { raw, hashed };

        const google = await waitForGoogle();
        if (cancelled) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup", // 👈 THIS IS THE FIX. It forces a clean modal overlay and hides the Supabase URL!
          callback: async (response: { credential: string }) => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
                nonce: nonceRef.current?.raw,
              });

              if (error) throw error;
              onSuccess?.();
            } catch (e: any) {
              const msg = e?.message || "Google sign-in failed";
              setError(msg);
              onError?.(msg);
            } finally {
              setLoading(false);
            }
          },
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = "";
          google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: buttonRef.current.offsetWidth || 360,
          });
        }
        setReady(true);
      } catch (e: any) {
        const msg = e?.message || "Google sign-in unavailable";
        setError(msg);
        onError?.(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { buttonRef, loading, ready, error };
}
