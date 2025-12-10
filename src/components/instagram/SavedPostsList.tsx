import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, FileEdit, Copy } from "lucide-react";
import type { SavedPost } from "@/types/instagram-post";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedPostsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: SavedPost[];
  isLoading: boolean;
  onLoad: (post: SavedPost) => void;
  onDuplicate: (post: SavedPost) => void;
  onDelete: (postId: string) => Promise<void>;
}

export const SavedPostsList = ({
  open,
  onOpenChange,
  posts,
  isLoading,
  onLoad,
  onDuplicate,
  onDelete,
}: SavedPostsListProps) => {
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<SavedPost | null>(null);

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  const handleDelete = async (post: SavedPost) => {
    setPostToDelete(post);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    
    setDeletingId(postToDelete.id);
    try {
      await onDelete(postToDelete.id);
    } finally {
      setDeletingId(null);
      setPostToDelete(null);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Saved Posts</SheetTitle>
          </SheetHeader>
          
          <div className="mt-4 space-y-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="draft" className="flex-1">Drafts</TabsTrigger>
                <TabsTrigger value="published" className="flex-1">Published</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <SpinningPaws size="lg" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {filter === 'all' ? 'No saved posts yet' : `No ${filter} posts`}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3 pr-4">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="border rounded-lg p-3 space-y-2 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {post.thumbnail_url && (
                          <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-16 h-16 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{post.title}</h4>
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                              {post.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(post.updated_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            onLoad(post);
                            onOpenChange(false);
                          }}
                        >
                          <FileEdit className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onDuplicate(post);
                            onOpenChange(false);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                        >
                          {deletingId === post.id ? (
                            <SpinningPaws size="sm" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
