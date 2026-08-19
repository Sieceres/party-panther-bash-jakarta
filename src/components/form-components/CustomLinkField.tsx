import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Check, Copy, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const SITE = "partypanther.net/";

interface CustomLinkFieldProps {
  value: string;
  onChange: (value: string) => void;
  eventId?: string;
  expiresAt?: string | null;
}

export const CustomLinkField = ({ value, onChange, eventId, expiresAt }: CustomLinkFieldProps) => {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  useEffect(() => {
    const slug = value.trim().toLowerCase();
    if (!slug) {
      setStatus("idle");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$/.test(slug)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    const t = setTimeout(async () => {
      const { data, error } = await (supabase as any).rpc("is_custom_slug_available", {
        _slug: slug,
        _event_id: eventId ?? null,
      });
      if (error) {
        setStatus("idle");
        return;
      }
      setStatus(data ? "available" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [value, eventId]);

  const clean = (raw: string) =>
    raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .slice(0, 40);

  return (
    <div className="space-y-2">
      <Label htmlFor="custom-link" className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        Custom link <span className="text-xs text-muted-foreground">(optional)</span>
      </Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground shrink-0">{SITE}</span>
        <Input
          id="custom-link"
          value={value}
          onChange={(e) => onChange(clean(e.target.value))}
          placeholder="rooftop-nye"
          maxLength={40}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(`https://${SITE}${value}`);
              toast.success("Link copied");
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="text-xs min-h-[1rem]">
        {status === "checking" && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking availability…
          </span>
        )}
        {status === "available" && (
          <span className="text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> Available
          </span>
        )}
        {status === "taken" && (
          <span className="text-destructive flex items-center gap-1">
            <X className="w-3 h-3" /> Already taken
          </span>
        )}
        {status === "invalid" && (
          <span className="text-destructive">3–40 characters: lowercase letters, numbers and hyphens</span>
        )}
        {status === "idle" && (
          <span className="text-muted-foreground">
            Reserved until 30 days after your event, then it becomes free for others.
            {expiresAt ? ` Currently held until ${new Date(expiresAt).toLocaleDateString()}.` : ""}
          </span>
        )}
      </div>
    </div>
  );
};
