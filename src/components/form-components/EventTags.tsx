import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EventTagsProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export const EventTags = ({ selectedTags, onChange }: EventTagsProps) => {
  const tagCategories = {
    "Music Type": ["Live Music", "DJ", "Karaoke", "EDM", "Rock", "World Music"],
    "Type of Event": ["Concert", "Festival", "Singles night", "Networking"],
    "Venue": ["Rooftop", "Lounge", "Bar", "Club"],
    "Offers": ["Happy Hour", "Free Flow", "Promos"],
    "Crowd": ["Students", "LGBTQ+ Friendly", "Over 30", "Expats", "Locals"]
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Event Tags</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select relevant tags to help people discover your event
        </p>
        
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Selected Tags ({selectedTags.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="default" 
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tag Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(tagCategories).map(([category, tags]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-sm text-primary">{category}</h4>
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <label
                    htmlFor={`tag-${tag}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};