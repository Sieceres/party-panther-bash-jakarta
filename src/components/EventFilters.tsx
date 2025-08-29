import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EventFiltersProps {
  onDateFilter: (date: Date | undefined) => void;
  onTagFilter: (tags: string[]) => void;
  onSearchFilter: (search: string) => void;
  onResetFilters: () => void;
  selectedDate?: Date;
  selectedTags: string[];
  searchTerm: string;
}

const EVENT_TAGS = {
  "Music Type": ["Live Music", "DJ", "Karaoke", "EDM", "Rock", "World Music"],
  "Type of Event": ["Concert", "Festival", "Singles night", "Networking"],
  "Venue": ["Rooftop", "Lounge", "Bar", "Club"],
  "Offers": ["Happy Hour", "Free Flow", "Promos"],
  "Crowd": ["Students", "LGBTQ+ Friendly", "Over 30", "Expats", "Locals"]
};

export const EventFilters = ({
  onDateFilter,
  onTagFilter,
  onSearchFilter,
  onResetFilters,
  selectedDate,
  selectedTags,
  searchTerm
}: EventFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) {
      onTagFilter([...selectedTags, tag]);
    } else {
      onTagFilter(selectedTags.filter(t => t !== tag));
    }
  };

  const hasActiveFilters = selectedDate || selectedTags.length > 0 || searchTerm;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => onSearchFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
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

        {/* Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Tags
          {selectedTags.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {selectedTags.length}
            </span>
          )}
        </Button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              onResetFilters();
              setShowFilters(false);
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Tag Filters */}
      {showFilters && (
        <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
          {Object.entries(EVENT_TAGS).map(([category, tags]) => (
            <div key={category}>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                {category}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => handleTagChange(tag, !!checked)}
                    />
                    <Label
                      htmlFor={tag}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Button
              key={tag}
              variant="secondary"
              size="sm"
              onClick={() => handleTagChange(tag, false)}
              className="flex items-center gap-1"
            >
              {tag}
              <X className="w-3 h-3" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};