import { supabase } from "@/integrations/supabase/client";

/**
 * Hard limit for a single AI extraction call.
 * Vision extraction routinely needs 15-40s, so a 10s cut-off would abort
 * healthy requests. 60s is the "it's really stuck" threshold.
 */
export const EXTRACTION_TIMEOUT_MS = 60000;

export class ExtractionTimeoutError extends Error {
  constructor() {
    super("Extraction timed out. The AI took too long to respond — please try again.");
    this.name = "ExtractionTimeoutError";
  }
}

/**
 * Invokes the extract-from-image edge function with a watchdog so the UI can
 * never get stuck in a permanent "Extracting..." state.
 */
export async function invokeExtraction<T = any>(
  body: Record<string, unknown>,
  timeoutMs: number = EXTRACTION_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ExtractionTimeoutError()), timeoutMs);
  });

  try {
    const result = (await Promise.race([
      supabase.functions.invoke("extract-from-image", { body }),
      timeout,
    ])) as { data: any; error: any };

    if (result.error) throw result.error;
    return result.data as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
