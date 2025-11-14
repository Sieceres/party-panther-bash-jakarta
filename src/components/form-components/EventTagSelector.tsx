import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Tag } from "lucide-react";

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


export const EventTagSelector = ({ selectedTagIds, onChange }: EventTagSelectorProps) => {
  const [tags, setTags] = useState<EventTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.rpc('get_event_tags_by_category' as any);
      if (error) throw error;
      setTags((data as EventTag[]) || []);
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

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tags...</div>;
  }

  const selectedCount = selectedTagIds.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">Event Tags (Optional)</Label>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {selectedCount > 0 && (
            <Badge variant="secondary" className="h-5">
              {selectedCount}
            </Badge>
          )}
          <span>{isOpen ? "Hide tags" : "Select tags"}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-3">
        <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/20">
          {tags.map((tag) => {
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
                  className={`${isSelected ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/50'} cursor-pointer hover:bg-primary/20 transition-colors`}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.name}
                </Badge>
              </label>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
