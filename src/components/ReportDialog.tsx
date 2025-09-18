import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportDialogProps {
  type: 'profile' | 'event' | 'promo' | 'comment';
  targetId: string;
  targetTitle: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ReportDialog = ({ type, targetId, targetTitle, open, onOpenChange }: ReportDialogProps) => {
  const [isOpen, setIsOpen] = useState(open || false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update internal state when external open prop changes
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const reasonOptions = {
    profile: [
      "Inappropriate content",
      "Fake profile",
      "Harassment",
      "Spam",
      "Other"
    ],
    event: [
      "Misleading information",
      "Inappropriate content",
      "Spam",
      "Fake event",
      "Other"
    ],
    promo: [
      "Misleading offer",
      "Inappropriate content",
      "Spam",
      "Fake promo",
      "Other"
    ],
    comment: [
      "Inappropriate content",
      "Harassment",
      "Spam",
      "Offensive language",
      "Other"
    ]
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to report content.",
          variant: "destructive"
        });
        return;
      }

      // Save the report to the database
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_type: type,
          target_id: targetId,
          target_title: targetTitle,
          reason: reason,
          description: description.trim() || null
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Report submitted",
        description: "Thank you for your report. We'll review it as soon as possible.",
      });

      setIsOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Flag className="w-4 h-4 mr-2" />
            Report
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {type}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Reporting: <strong>{targetTitle}</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions[type].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional details about this report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};