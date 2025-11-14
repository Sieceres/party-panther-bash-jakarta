import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Search, X, Music, Calendar as CalendarTag, Building2, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EventFiltersProps {
  onDateFilter: (date: Date | undefined) => void;
  onSearchFilter: (search: string) => void;
  onTagFilter: (tagIds: string[]) => void;
  onResetFilters: () => void;
  selectedDate?: Date;
  searchTerm: string;
  selectedTagIds: string[];
}

const categoryConfig = {
  music_type: { label: "Music", icon: Music, color: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
  event_type: { label: "Type", icon: CalendarTag, color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  venue: { label: "Venue", icon: Building2, color: "bg-green-500/10 text-green-700 border-green-500/20" },
  crowd: { label: "Crowd", icon: Users, color: "bg-orange-500/10 text-orange-700 border-orange-500/20" }
};

export const EventFilters = ({
  onDateFilter,
  onSearchFilter,
  onTagFilter,
  onResetFilters,
  selectedDate,
  searchTerm,
  selectedTagIds
}: EventFiltersProps) => {
  const [tags, setTags] = useState<any[]>([]);
  const hasActiveFilters = selectedDate || searchTerm || selectedTagIds.length > 0;

  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.rpc('get_event_tags_by_category');
      if (data) setTags(data);
    };
    fetchTags();
  }, []);

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagFilter(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagFilter([...selectedTagIds, tagId]);
    }
  };

  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, any[]>);

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

      {/* Tag Filters */}
      {Object.keys(groupedTags).length > 0 && (
        <div className="space-y-3 p-4 bg-card/50 rounded-lg border border-border/50">
          <h4 className="text-sm font-medium">Filter by Tags</h4>
          <div className="space-y-3">
            {Object.entries(groupedTags).map(([category, categoryTags]) => {
              const config = categoryConfig[category as keyof typeof categoryConfig];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(categoryTags as any[]).map((tag: any) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <label key={tag.id} className="cursor-pointer">
                          <Badge
                            variant="outline"
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected ? config.color : "bg-muted/50 hover:bg-muted"
                            )}
                            onClick={() => handleTagToggle(tag.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="mr-1.5 w-3 h-3"
                              onCheckedChange={() => handleTagToggle(tag.id)}
                            />
                            {tag.name}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};