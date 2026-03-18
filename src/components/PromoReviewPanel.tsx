import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PROMO_TYPES, type PromoType } from "@/lib/promo-types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromoItem {
  id: string;
  title: string;
  venue_name: string;
  category: string | null; // This is promo_type passed in
}

interface UndoEntry {
  promoId: string;
  previousCategory: string | null;
}

interface PromoReviewPanelProps {
  promos: PromoItem[];
  onClose: () => void;
  selectedPromoId: string | null;
  onSelectedChange: (id: string | null) => void;
  onCategoryUpdated: (promoId: string, newCategory: string) => void;
}

const SHORTCUT_MAP: Record<string, PromoType> = {
  h: "Happy Hour",
  s: "Ladies Night",
  f: "Free Flow",
  b: "Bottle Promo",
  d: "Beer Deal",
  t: "Other",
};

const KEY_LABELS: Record<string, string> = {
  h: "H",
  s: "S",
  f: "F",
  b: "B",
  d: "D",
  t: "T",
};

export const PromoReviewPanel = ({
  promos,
  onClose,
  selectedPromoId,
  onSelectedChange,
  onCategoryUpdated,
}: PromoReviewPanelProps) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const [undoCount, setUndoCount] = useState(0);

  const currentIndex = promos.findIndex((p) => p.id === selectedPromoId);
  const currentPromo = currentIndex >= 0 ? promos[currentIndex] : null;

  const selectByIndex = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= promos.length) return;
      const id = promos[idx].id;
      onSelectedChange(id);
      document.getElementById(`promo-card-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [promos, onSelectedChange]
  );

  const selectPrev = useCallback(() => {
    selectByIndex(currentIndex <= 0 ? promos.length - 1 : currentIndex - 1);
  }, [currentIndex, promos.length, selectByIndex]);

  const selectNext = useCallback(() => {
    selectByIndex(currentIndex >= promos.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, promos.length, selectByIndex]);

  const updateCategory = useCallback(
    async (newType: PromoType) => {
      if (!currentPromo || updating) return;
      const previousCategory = currentPromo.category;
      setUpdating(true);
      try {
        const { error } = await supabase
          .from("promos")
          .update({ promo_type: newType })
          .eq("id", currentPromo.id);
        if (error) throw error;
        // Push to undo stack
        undoStackRef.current.push({ promoId: currentPromo.id, previousCategory });
        setUndoCount(undoStackRef.current.length);
        onCategoryUpdated(currentPromo.id, newType);
        toast({ title: `Set to ${newType}`, description: currentPromo.title });
        selectNext();
      } catch (err: any) {
        toast({
          title: "Update failed",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setUpdating(false);
      }
    },
    [currentPromo, updating, onCategoryUpdated, toast, selectNext]
  );

  const handleUndo = useCallback(async () => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    setUndoCount(undoStackRef.current.length);
    try {
      const { error } = await supabase
        .from("promos")
        .update({ promo_type: entry.previousCategory })
        .eq("id", entry.promoId);
      if (error) throw error;
      onCategoryUpdated(entry.promoId, entry.previousCategory || "");
      onSelectedChange(entry.promoId);
      document.getElementById(`promo-card-${entry.promoId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      toast({ title: "Undone", description: `Reverted to ${entry.previousCategory || "None"}` });
    } catch (err: any) {
      toast({ title: "Undo failed", description: err.message, variant: "destructive" });
    }
  }, [onCategoryUpdated, onSelectedChange, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (key === "q") {
        e.preventDefault();
        selectPrev();
      } else if (key === "a") {
        e.preventDefault();
        selectNext();
      } else if (SHORTCUT_MAP[key]) {
        e.preventDefault();
        updateCategory(SHORTCUT_MAP[key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectPrev, selectNext, updateCategory, handleUndo]);

  // Auto-select first on mount if nothing selected
  useEffect(() => {
    if (!selectedPromoId && promos.length > 0) {
      onSelectedChange(promos[0].id);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h4 className="text-sm font-bold text-foreground">Category Review</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {currentIndex >= 0 ? currentIndex + 1 : "—"}/{promos.length}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={undoCount === 0}
            className="h-6 w-6 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="px-4 pb-2 border-b border-border space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Q</kbd>
          <span>Prev</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono ml-2">A</kbd>
          <span>Next</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono ml-2">⌃Z</kbd>
          <span>Undo</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(SHORTCUT_MAP).map(([key, type]) => (
            <button
              key={key}
              onClick={() => updateCategory(type)}
              disabled={updating || !currentPromo}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left",
                "hover:bg-primary/10 disabled:opacity-50",
                currentPromo?.category === type && "bg-primary/20 text-primary font-medium"
              )}
            >
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono min-w-[18px] text-center">
                {KEY_LABELS[key]}
              </kbd>
              <span className="truncate">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Promo List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-0.5">
          {promos.map((promo, idx) => (
            <button
              key={promo.id}
              onClick={() => {
                onSelectedChange(promo.id);
                document.getElementById(`promo-card-${promo.id}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2",
                promo.id === selectedPromoId
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <span className="text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
              <span className="truncate flex-1 font-medium">{promo.title}</span>
              {promo.category ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  {promo.category}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-[10px] shrink-0">—</span>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
