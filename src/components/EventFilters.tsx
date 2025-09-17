import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EventFiltersProps {
  onDateFilter: (date: Date | undefined) => void;
  onSearchFilter: (search: string) => void;
  onResetFilters: () => void;
  selectedDate?: Date;
  searchTerm: string;
}

export const EventFilters = ({
  onDateFilter,
  onSearchFilter,
  onResetFilters,
  selectedDate,
  searchTerm
}: EventFiltersProps) => {
  const hasActiveFilters = selectedDate || searchTerm;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => onSearchFilter(e.target.value)}
            className="glass-control pl-12 pr-4 h-10"
            style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '25px' }}
          />
        </div>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="glass-control justify-start text-left font-normal flex items-center gap-2 h-10 px-4"
              style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '25px' }}
            >
              <CalendarIcon className="h-4 w-4 text-cyan-400" />
              <span className={cn(!selectedDate && "text-gray-400")}>
                {selectedDate ? format(selectedDate, "PPP") : "Select date"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateFilter}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onResetFilters}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};