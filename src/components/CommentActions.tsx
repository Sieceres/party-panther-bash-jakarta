import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReportDialog } from "./ReportDialog";

interface CommentActionsProps {
  comment: {
    id: string;
    user_id: string;
    comment: string;
    profiles?: {
      display_name?: string;
    };
  };
  currentUserId?: string;
  isAdmin?: boolean;
  onCommentDeleted: (commentId: string) => void;
  commentType: 'event' | 'promo';
}

export const CommentActions = ({ 
  comment, 
  currentUserId, 
  isAdmin, 
  onCommentDeleted,
  commentType 
}: CommentActionsProps) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const isOwner = currentUserId === comment.user_id;
  const canDelete = isOwner || isAdmin;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const tableName = commentType === 'event' ? 'event_comments' : 'promo_comments';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "The comment has been successfully deleted.",
      });

      onCommentDeleted(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  if (!currentUserId) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteAlert(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Comment
            </DropdownMenuItem>
          )}
          {!isOwner && (
            <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Report Comment
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        type="comment"
        targetId={comment.id}
        targetTitle={`Comment by ${comment.profiles?.display_name || 'Anonymous'}`}
      />
    </>
  );
};