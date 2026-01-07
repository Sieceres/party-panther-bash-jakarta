import { useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DuplicateMatch } from "@/hooks/useDuplicateCheck";

interface DuplicateWarningProps {
  type: "promo" | "event";
  duplicates: DuplicateMatch[];
  isChecking: boolean;
  hasChecked: boolean;
  onConfirm: (confirmed: boolean) => void;
  confirmed: boolean;
}

export function DuplicateWarning({
  type,
  duplicates,
  isChecking,
  hasChecked,
  onConfirm,
  confirmed,
}: DuplicateWarningProps) {
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking for similar {type}s...</span>
      </div>
    );
  }

  if (!hasChecked || duplicates.length === 0) {
    return null;
  }

  const getViewUrl = (duplicate: DuplicateMatch) => {
    if (type === "promo") {
      return duplicate.slug ? `/promo/${duplicate.slug}` : `/promo/${duplicate.id}`;
    }
    return duplicate.slug ? `/event/${duplicate.slug}` : `/event/${duplicate.id}`;
  };

  return (
    <Alert className="border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">
        Potential {duplicates.length === 1 ? "duplicate" : "duplicates"} found
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-4">
        <p className="text-sm text-muted-foreground">
          We found {duplicates.length} existing {type}
          {duplicates.length > 1 ? "s" : ""} that might be similar to what you're creating:
        </p>

        <div className="space-y-3">
          {duplicates.map((duplicate) => (
            <div
              key={duplicate.id}
              className="p-3 bg-background border border-border rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {duplicate.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {duplicate.venue}
                    {duplicate.date && ` • ${new Date(duplicate.date).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium px-2 py-1 bg-warning/20 text-warning rounded">
                    {duplicate.confidence}% match
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                {duplicate.reason}
              </p>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full mt-2"
              >
                <a href={getViewUrl(duplicate)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-2" />
                  View existing {type}
                </a>
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-border">
          <Checkbox
            id="confirm-not-duplicate"
            checked={confirmed}
            onCheckedChange={(checked) => onConfirm(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="confirm-not-duplicate"
            className="text-sm text-foreground cursor-pointer leading-relaxed"
          >
            I've checked the existing {type}
            {duplicates.length > 1 ? "s" : ""} and confirm this is not a duplicate
          </Label>
        </div>
      </AlertDescription>
    </Alert>
  );
}
