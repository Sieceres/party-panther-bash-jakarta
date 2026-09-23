import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BulkDeleteBarProps {
  ids: string[];
  type: "promo" | "event";
  onClear: () => void;
  onDeleted?: () => void;
}

export const deleteManyByIds = async (ids: string[], type: "promo" | "event") => {
  let deleted = 0;
  const failures: string[] = [];
  for (const id of ids) {
    try {
      const body = type === "promo" ? { type, promo_id: id } : { type, event_id: id };
      const res = await supabase.functions.invoke("secure-delete", { body });
      if (res.error || !res.data?.success) {
        failures.push(res.data?.error || res.error?.message || "Delete failed");
      } else {
        deleted++;
      }
    } catch (err: any) {
      failures.push(err?.message || "Delete failed");
    }
  }
  return { deleted, failures };
};

export const BulkDeleteBar = ({ ids, type, onClear, onDeleted }: BulkDeleteBarProps) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (ids.length === 0) return null;

  const label = type === "promo" ? "promo" : "event";

  const handleDelete = async () => {
    setBusy(true);
    const { deleted, failures } = await deleteManyByIds(ids, type);
    setBusy(false);

    if (failures.length > 0) {
      toast({
        title: `Deleted ${deleted}, ${failures.length} failed`,
        description: failures[0],
        variant: "destructive",
      });
    } else {
      toast({ title: `Deleted ${deleted} ${label}${deleted !== 1 ? "s" : ""}` });
    }

    onClear();
    if (onDeleted) {
      onDeleted();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1200] w-[min(560px,calc(100%-2rem))]">
      <div className="flex items-center justify-between gap-3 rounded-full border border-border/60 bg-background/95 backdrop-blur px-4 py-2 shadow-lg">
        <span className="text-sm font-medium text-white">
          {ids.length} {label}{ids.length !== 1 ? "s" : ""} selected
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear} disabled={busy}>
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={busy}>
                <Trash2 className="w-4 h-4 mr-1" />
                {busy ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {ids.length} {label}{ids.length !== 1 ? "s" : ""}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the selected {label}s. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
