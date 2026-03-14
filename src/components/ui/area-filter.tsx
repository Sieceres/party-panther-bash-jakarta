import * as React from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { JAKARTA_AREAS } from "@/lib/area-config";

interface CollapsibleRegionProps {
  regionKey: string;
  regionLabel: string;
  neighborhoods: string[];
  /** Which values are currently selected (region keys or neighborhood names) */
  selectedValues: string[];
  onToggle: (value: string) => void;
  /** If true, renders radio-style (visual only — logic is handled by parent) */
  singleSelect?: boolean;
}

function CollapsibleRegion({
  regionKey,
  regionLabel,
  neighborhoods,
  selectedValues,
  onToggle,
  singleSelect = false,
}: CollapsibleRegionProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isRegionSelected = selectedValues.includes(regionKey);
  const hasNeighborhoodSelected = neighborhoods.some((n) =>
    selectedValues.includes(n)
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 rounded hover:bg-accent/50 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
        {!singleSelect && (
          <Checkbox
            id={`area-${regionKey}`}
            checked={isRegionSelected}
            onCheckedChange={() => onToggle(regionKey)}
          />
        )}
        <Label
          htmlFor={singleSelect ? undefined : `area-${regionKey}`}
          className={cn(
            "text-sm font-semibold cursor-pointer flex-1",
            singleSelect && "ml-0.5"
          )}
          onClick={() => {
            if (singleSelect) onToggle(regionKey);
          }}
        >
          {regionLabel}
          {hasNeighborhoodSelected && !isRegionSelected && (
            <span className="ml-1 text-xs text-primary">●</span>
          )}
        </Label>
      </div>
      {expanded &&
        neighborhoods.map((hood) => {
          const isSelected = selectedValues.includes(hood);
          return (
            <div
              key={hood}
              className="flex items-center space-x-2 pl-7"
            >
              {!singleSelect && (
                <Checkbox
                  id={`area-${hood}`}
                  checked={isSelected}
                  onCheckedChange={() => onToggle(hood)}
                />
              )}
              <Label
                htmlFor={singleSelect ? undefined : `area-${hood}`}
                className={cn(
                  "text-sm cursor-pointer",
                  singleSelect && isSelected && "text-primary font-medium"
                )}
                onClick={() => {
                  if (singleSelect) onToggle(hood);
                }}
              >
                {hood}
              </Label>
            </div>
          );
        })}
    </div>
  );
}

interface AreaFilterListProps {
  selectedValues: string[];
  onToggle: (value: string) => void;
  /** Show "All areas" option with checkbox */
  showAll?: boolean;
  allChecked?: boolean;
  onAllToggle?: () => void;
  singleSelect?: boolean;
}

/**
 * Renders the list of Jakarta regions with collapsible neighborhoods.
 * Use inside a Popover/SelectContent/etc.
 */
export function AreaFilterList({
  selectedValues,
  onToggle,
  showAll = false,
  allChecked = false,
  onAllToggle,
  singleSelect = false,
}: AreaFilterListProps) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto p-2">
      {showAll && onAllToggle && (
        <div className="flex items-center space-x-2">
          {!singleSelect ? (
            <>
              <Checkbox
                id="all-areas"
                checked={allChecked}
                onCheckedChange={() => onAllToggle()}
              />
              <Label htmlFor="all-areas" className="text-sm">
                All areas
              </Label>
            </>
          ) : (
            <Label
              className={cn(
                "text-sm cursor-pointer pl-1",
                allChecked && "text-primary font-medium"
              )}
              onClick={() => onAllToggle()}
            >
              All areas
            </Label>
          )}
        </div>
      )}
      {JAKARTA_AREAS.map((region) => (
        <CollapsibleRegion
          key={region.key}
          regionKey={region.key}
          regionLabel={region.label}
          neighborhoods={region.neighborhoods}
          selectedValues={selectedValues}
          onToggle={onToggle}
          singleSelect={singleSelect}
        />
      ))}
    </div>
  );
}
