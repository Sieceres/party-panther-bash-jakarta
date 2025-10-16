import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AttendeeNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  userId: string;
  initialNote?: string;
  onNoteSaved?: () => void;
}

export const AttendeeNoteDialog = ({ 
  open, 
  onOpenChange, 
  eventId, 
  userId, 
  initialNote = "",
  onNoteSaved 
}: AttendeeNoteDialogProps) => {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('event_attendees')
        .update({ note: note.trim() || null })
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Note saved!",
        description: "Your attendance note has been updated.",
      });
      
      onNoteSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Attendance Note</DialogTitle>
          <DialogDescription>
            Add a note to your attendance (optional). This will be visible to other attendees.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="E.g., Looking forward to meeting new people! Coming with 2 friends..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={200}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {note.length}/200 characters
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
