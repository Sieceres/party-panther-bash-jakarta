import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selectedValues = [],
  onSelectionChange,
  placeholder = "Select items...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const norm = (v: string) => (v ?? "").toString().trim().toLowerCase();

  // Map any incoming value (different casing, or the label instead of the value)
  // onto the canonical option value so checkmarks always reflect the selection.
  const canonical = React.useMemo(() => {
    return selectedValues
      .map((v) => {
        const match = options.find(
          (opt) => norm(opt.value) === norm(v) || norm(opt.label) === norm(v)
        );
        return match ? match.value : null;
      })
      .filter((v): v is string => v !== null);
  }, [selectedValues, options]);

  const isSelected = (optionValue: string) => canonical.includes(optionValue);

  const handleOptionToggle = (optionValue: string) => {
    const newValues = isSelected(optionValue)
      ? canonical.filter((value) => value !== optionValue)
      : [...canonical, optionValue];

    onSelectionChange(newValues);
  };

  const getDisplayText = () => {
    if (canonical.length === 0) {
      return placeholder;
    }
    if (canonical.length <= 2) {
      return canonical
        .map((v) => options.find((opt) => opt.value === v)?.label || v)
        .join(", ");
    }
    return `${canonical.length} selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            selectedValues.length === 0 && "text-muted-foreground",
            className
          )}
        >
          {getDisplayText()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() => handleOptionToggle(option.value)}
            >
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onChange={() => handleOptionToggle(option.value)}
              />
              <label
                className="flex-1 text-sm font-normal cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {option.label}
              </label>
              {selectedValues.includes(option.value) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}