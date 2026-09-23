import { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SelectableItemProps {
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Wraps a card so that, in select mode, clicking anywhere toggles selection
 * instead of navigating.
 */
export const SelectableItem = ({ selectMode, selected, onToggle, children }: SelectableItemProps) => (
  <div className={cn("relative rounded-2xl", selected && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
    {children}
    {selectMode && (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          "absolute inset-0 z-40 rounded-2xl cursor-pointer transition-colors",
          selected ? "bg-primary/10" : "bg-background/10 hover:bg-primary/5"
        )}
      >
        <span className="absolute top-3 left-3 rounded-md bg-background/90 p-1 shadow">
          <Checkbox checked={selected} className="pointer-events-none" />
        </span>
      </div>
    )}
  </div>
);
