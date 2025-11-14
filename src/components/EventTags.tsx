import { Badge } from "@/components/ui/badge";
import { Music, Calendar, Building2, Users } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  category: string;
}

interface EventTagsProps {
  tags: Tag[];
  variant?: 'full' | 'compact';
}

const categoryConfig = {
  music_type: {
    label: "Music",
    icon: Music,
    color: "bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20"
  },
  event_type: {
    label: "Type",
    icon: Calendar,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20"
  },
  venue: {
    label: "Venue",
    icon: Building2,
    color: "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20"
  },
  crowd: {
    label: "Crowd",
    icon: Users,
    color: "bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20"
  }
};

export const EventTags = ({ tags, variant = 'full' }: EventTagsProps) => {
  if (!tags || tags.length === 0) return null;

  if (variant === 'compact') {
    // Show only first 3 tags for cards
    const displayTags = tags.slice(0, 3);
    
    return (
      <div className="flex flex-wrap gap-1.5">
        {displayTags.map((tag) => {
          const config = categoryConfig[tag.category as keyof typeof categoryConfig];
          if (!config) return null;
          const Icon = config.icon;
          
          return (
            <Badge 
              key={tag.id} 
              variant="outline" 
              className={`text-xs ${config.color}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          );
        })}
        {tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{tags.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  // Full display - grouped by category
  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  return (
    <div className="space-y-3">
      {Object.entries(groupedTags).map(([category, categoryTags]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        if (!config) return null;
        const Icon = config.icon;

        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="w-4 h-4" />
              <span className="font-medium">{config.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryTags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="outline" 
                  className={config.color}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
