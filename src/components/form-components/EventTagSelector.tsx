import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Music, Calendar, Building2, Users } from "lucide-react";

interface EventTag {
  id: string;
  name: string;
  category: string;
  sort_order: number;
}

interface EventTagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const categoryConfig = {
  music_type: {
    label: "Music Type",
    icon: Music,
    color: "bg-purple-500/10 text-purple-700 border-purple-500/20"
  },
  event_type: {
    label: "Event Type",
    icon: Calendar,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20"
  },
  venue: {
    label: "Venue",
    icon: Building2,
    color: "bg-green-500/10 text-green-700 border-green-500/20"
  },
  crowd: {
    label: "Crowd",
    icon: Users,
    color: "bg-orange-500/10 text-orange-700 border-orange-500/20"
  }
};

export const EventTagSelector = ({ selectedTagIds, onChange }: EventTagSelectorProps) => {
  const [tags, setTags] = useState<EventTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.rpc('get_event_tags_by_category');
      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, EventTag[]>);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tags...</div>;
  }

  return (
    <div className="space-y-6">
      <Label className="text-base">Event Tags (Optional)</Label>
      
      {Object.entries(groupedTags).map(([category, categoryTags]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        if (!config) return null;
        
        const Icon = config.icon;
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{config.label}</Label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categoryTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                
                return (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Badge
                      variant="outline"
                      className={`${isSelected ? config.color : 'bg-muted/50'} cursor-pointer`}
                    >
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
  );
};
