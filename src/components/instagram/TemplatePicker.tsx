import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Star, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateCard } from "./TemplateCard";
import { toast } from "sonner";
import { STARTER_TEMPLATES } from "@/lib/starter-templates";
import type { PostContent } from "@/types/instagram-post";

interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  settings_url?: string;
  settings?: PostContent;
  is_starter?: boolean;
  is_public?: boolean;
  created_by?: string;
}

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (settings: PostContent) => void;
  currentUserId?: string;
}

export const TemplatePicker = ({ open, onOpenChange, onSelectTemplate, currentUserId }: TemplatePickerProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("starter");

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("instagram_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: Template) => {
    try {
      // If template has inline settings (built-in starter), use directly
      if (template.settings) {
        onSelectTemplate(template.settings);
        onOpenChange(false);
        toast.success(`Template "${template.name}" applied`);
        return;
      }
      
      // Otherwise fetch from URL
      if (template.settings_url) {
        let settings: PostContent;
        
        // Handle data URL fallback
        if (template.settings_url.startsWith('data:application/json;base64,')) {
          const base64 = template.settings_url.replace('data:application/json;base64,', '');
          const jsonString = decodeURIComponent(escape(atob(base64)));
          settings = JSON.parse(jsonString);
        } else {
          const response = await fetch(template.settings_url);
          settings = await response.json();
        }
        
        onSelectTemplate(settings);
        onOpenChange(false);
        toast.success(`Template "${template.name}" applied`);
      }
    } catch (error) {
      console.error("Error loading template settings:", error);
      toast.error("Failed to load template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("instagram_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success("Template deleted");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  // Built-in starter templates
  const builtInTemplates: Template[] = STARTER_TEMPLATES.map((t, i) => ({
    id: `starter-${i}`,
    name: t.name,
    description: t.description,
    settings: t.settings,
    is_starter: true,
  }));
  
  // Database templates
  const starterTemplates = [...builtInTemplates, ...templates.filter(t => t.is_starter)];
  const publicTemplates = templates.filter(t => t.is_public && !t.is_starter);
  const myTemplates = templates.filter(t => t.created_by === currentUserId && !t.is_starter);

  const filterBySearch = (list: Template[]) => {
    if (!search.trim()) return list;
    const searchLower = search.toLowerCase();
    return list.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    );
  };

  const renderTemplateGrid = (list: Template[], showDelete = false) => {
    const filtered = filterBySearch(list);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {search ? "No templates match your search" : "No templates yet"}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={handleSelectTemplate}
            onDelete={showDelete ? handleDeleteTemplate : undefined}
            isOwner={template.created_by === currentUserId}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="starter" className="gap-1.5">
                <Star className="w-4 h-4" />
                Starter
              </TabsTrigger>
              <TabsTrigger value="public" className="gap-1.5">
                <Users className="w-4 h-4" />
                Public
              </TabsTrigger>
              <TabsTrigger value="my" className="gap-1.5">
                <User className="w-4 h-4" />
                My Templates
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="starter" className="mt-0">
                {renderTemplateGrid(starterTemplates)}
              </TabsContent>
              <TabsContent value="public" className="mt-0">
                {renderTemplateGrid(publicTemplates)}
              </TabsContent>
              <TabsContent value="my" className="mt-0">
                {renderTemplateGrid(myTemplates, true)}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
