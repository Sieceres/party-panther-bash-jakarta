import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Reply, ChevronDown, ChevronUp } from "lucide-react";
import { CommentActions } from "./CommentActions";
import defaultAvatar from "@/assets/default-avatar.png";

export interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  profiles?: {
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
  } | null;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  isAdmin: boolean;
  onCommentDeleted: (commentId: string) => void;
  onReply: (parentId: string, content: string) => Promise<void>;
  onProfileClick: (userId: string) => void;
  commentType: "event" | "promo";
  isLoggedIn: boolean;
  depth?: number;
}

export const CommentItem = ({
  comment,
  currentUserId,
  isAdmin,
  onCommentDeleted,
  onReply,
  onProfileClick,
  commentType,
  isLoggedIn,
  depth = 0,
}: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReplyForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 2; // Limit nesting depth

  return (
    <div className={`${depth > 0 ? 'ml-6 sm:ml-10 border-l-2 border-muted pl-3 sm:pl-4' : ''}`}>
      <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
        <div className="flex gap-3">
          <Avatar
            className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onProfileClick(comment.user_id)}
          >
            <AvatarImage src={comment.profiles?.avatar_url || defaultAvatar} />
            <AvatarFallback className="text-xs sm:text-sm">
              {comment.profiles?.display_name?.[0]?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  className="text-sm sm:text-base font-medium cursor-pointer hover:text-primary transition-colors"
                  onClick={() => onProfileClick(comment.user_id)}
                >
                  {comment.profiles?.display_name || "Anonymous"}
                </span>
                {comment.profiles?.is_verified && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Verified
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <CommentActions
                comment={comment}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onCommentDeleted={onCommentDeleted}
                commentType={commentType}
              />
            </div>
            <p className="text-sm leading-relaxed font-light mt-2">{comment.comment}</p>
            
            {/* Reply button - only show if logged in and not at max depth */}
            {isLoggedIn && depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-muted-foreground hover:text-foreground -ml-2"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="w-3.5 h-3.5 mr-1" />
                Reply
              </Button>
            )}

            {/* Reply form */}
            {showReplyForm && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="text-sm"
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{replyContent.length}/500</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? "Posting..." : "Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show/hide replies toggle */}
      {hasReplies && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowReplies(!showReplies)}
        >
          {showReplies ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 mr-1" />
              Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 mr-1" />
              Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </>
          )}
        </Button>
      )}

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <div className="mt-2 space-y-2">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onCommentDeleted={onCommentDeleted}
              onReply={onReply}
              onProfileClick={onProfileClick}
              commentType={commentType}
              isLoggedIn={isLoggedIn}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
