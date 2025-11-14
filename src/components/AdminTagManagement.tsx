import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Music, Calendar, Building2, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface EventTag {
  id: string;
  name: string;
  category: string;
  sort_order: number;
  created_at?: string;
}

const categoryConfig = {
  music_type: { label: "Music Type", icon: Music, color: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
  event_type: { label: "Event Type", icon: Calendar, color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  venue: { label: "Venue", icon: Building2, color: "bg-green-500/10 text-green-700 border-green-500/20" },
  crowd: { label: "Crowd", icon: Users, color: "bg-orange-500/10 text-orange-700 border-orange-500/20" }
};

export const AdminTagManagement = () => {
  const [tags, setTags] = useState<EventTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<EventTag | null>(null);
  const [newTag, setNewTag] = useState({ name: "", category: "event_type", sort_order: 0 });
  const { toast } = useToast();

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
      toast({ title: "Error", description: "Failed to fetch tags", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({ title: "Error", description: "Tag name is required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('event_tags')
        .insert([{ 
          name: newTag.name.trim(), 
          category: newTag.category,
          sort_order: newTag.sort_order || 0
        }]);

      if (error) throw error;

      toast({ title: "Success", description: "Tag created successfully" });
      setNewTag({ name: "", category: "event_type", sort_order: 0 });
      fetchTags();
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({ title: "Error", description: error.message || "Failed to create tag", variant: "destructive" });
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      const { error } = await supabase
        .from('event_tags')
        .update({ 
          name: editingTag.name, 
          category: editingTag.category,
          sort_order: editingTag.sort_order
        })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast({ title: "Success", description: "Tag updated successfully" });
      setEditingTag(null);
      fetchTags();
    } catch (error: any) {
      console.error('Error updating tag:', error);
      toast({ title: "Error", description: error.message || "Failed to update tag", variant: "destructive" });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('event_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({ title: "Success", description: "Tag deleted successfully" });
      fetchTags();
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast({ title: "Error", description: error.message || "Failed to delete tag", variant: "destructive" });
    }
  };

  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, EventTag[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Tag Name</Label>
              <Input
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="e.g., Hip Hop"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newTag.category} onValueChange={(value) => setNewTag({ ...newTag, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={newTag.sort_order}
                onChange={(e) => setNewTag({ ...newTag, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <Button onClick={handleCreateTag}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        </CardContent>
      </Card>

      {Object.entries(groupedTags).map(([category, categoryTags]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        if (!config) return null;
        const Icon = config.icon;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryTags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    {editingTag?.id === tag.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          className="max-w-xs"
                        />
                        <Input
                          type="number"
                          value={editingTag.sort_order}
                          onChange={(e) => setEditingTag({ ...editingTag, sort_order: parseInt(e.target.value) || 0 })}
                          className="max-w-[100px]"
                        />
                        <Button onClick={handleUpdateTag} size="sm">Save</Button>
                        <Button onClick={() => setEditingTag(null)} size="sm" variant="outline">Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={config.color}>{tag.name}</Badge>
                          <span className="text-sm text-muted-foreground">Order: {tag.sort_order}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setEditingTag(tag)} size="sm" variant="ghost">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{tag.name}"? This will remove it from all events.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
