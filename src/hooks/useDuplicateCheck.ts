import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DuplicateMatch {
  id: string;
  title: string;
  venue: string;
  slug?: string;
  createdAt: string;
  creatorName?: string;
  confidence: number;
  reason: string;
  date?: string;
}

interface UseDuplicateCheckOptions {
  type: "promo" | "event";
  title: string;
  venue: string;
  description?: string;
  promoType?: string;
  area?: string;
  date?: string;
  enabled?: boolean;
}

interface UseDuplicateCheckResult {
  duplicates: DuplicateMatch[];
  isChecking: boolean;
  error: string | null;
  hasChecked: boolean;
}

export function useDuplicateCheck({
  type,
  title,
  venue,
  description,
  promoType,
  area,
  date,
  enabled = true,
}: UseDuplicateCheckOptions): UseDuplicateCheckResult {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<string>("");

  const checkForDuplicates = useCallback(async () => {
    // Generate a cache key to avoid redundant checks
    const cacheKey = `${type}|${title}|${venue}|${promoType}|${area}|${date}`;
    if (cacheKey === lastCheckRef.current) {
      return;
    }

    // Must have at least title and venue to check
    if (!title.trim() || !venue.trim()) {
      setDuplicates([]);
      setHasChecked(false);
      return;
    }

    lastCheckRef.current = cacheKey;
    setIsChecking(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-duplicates", {
        body: {
          type,
          title: title.trim(),
          venue: venue.trim(),
          description: description?.trim(),
          promoType,
          area,
          date,
        },
      });

      if (fnError) {
        console.error("Duplicate check error:", fnError);
        setError("Failed to check for duplicates");
        setDuplicates([]);
      } else {
        setDuplicates(data?.duplicates || []);
        if (data?.error) {
          console.warn("Duplicate check warning:", data.error);
        }
      }
    } catch (err) {
      console.error("Duplicate check failed:", err);
      setError("Failed to check for duplicates");
      setDuplicates([]);
    } finally {
      setIsChecking(false);
      setHasChecked(true);
    }
  }, [type, title, venue, description, promoType, area, date]);

  useEffect(() => {
    if (!enabled) {
      setDuplicates([]);
      setHasChecked(false);
      return;
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only check if we have minimum required fields
    if (!title.trim() || !venue.trim()) {
      setDuplicates([]);
      setHasChecked(false);
      return;
    }

    // Debounce the check by 800ms
    debounceRef.current = setTimeout(() => {
      checkForDuplicates();
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, title, venue, promoType, area, date, checkForDuplicates]);

  return {
    duplicates,
    isChecking,
    error,
    hasChecked,
  };
}
