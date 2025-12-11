import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Star } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  is_starter?: boolean;
  is_public?: boolean;
  created_by?: string;
}

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  isOwner?: boolean;
}

export const TemplateCard = ({ template, onSelect, onDelete, isOwner }: TemplateCardProps) => {
  return (
    <Card className="group relative overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div 
          className="aspect-square bg-muted flex items-center justify-center overflow-hidden"
          onClick={() => onSelect(template)}
        >
          {template.thumbnail_url ? (
            <img 
              src={template.thumbnail_url} 
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary/30">
                {template.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            {template.is_starter && (
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            )}
            <h4 className="font-medium text-sm truncate">{template.name}</h4>
          </div>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" onClick={() => onSelect(template)}>
            <Check className="w-4 h-4 mr-1" />
            Use
          </Button>
          {isOwner && onDelete && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(template.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
