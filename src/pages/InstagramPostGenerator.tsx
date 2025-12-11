import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { PostEditor } from "@/components/instagram/PostEditor";
import { PostPreview } from "@/components/instagram/PostPreview";
import { SavePostDialog } from "@/components/instagram/SavePostDialog";
import { SavedPostsList } from "@/components/instagram/SavedPostsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, FolderOpen, FilePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkUserAdminStatus } from "@/lib/auth-helpers";
import { useToast } from "@/hooks/use-toast";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { usePageTitle } from "@/hooks/usePageTitle";
import { uploadJsonToCloudinary, uploadCanvasToCloudinary, fetchJsonFromCloudinary } from "@/lib/cloudinary";
import type { PostContent, SavedPost, DEFAULT_POST_CONTENT } from "@/types/instagram-post";

const defaultContent: PostContent = {
  headline: "",
  sections: [{ subheadline: "", body: "" }],
  format: "square",
  backgroundStyle: "dark-gradient",
  showLogo: true,
  fonts: {
    headline: "Poppins",
    subheadline: "Poppins",
    body: "Poppins",
  },
  fontSizes: {
    headline: 72,
    subheadline: 48,
    body: 32,
  },
  textPosition: {
    x: 50,
    y: 50,
  },
};

const InstagramPostGenerator = () => {
  usePageTitle("Instagram Generator");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState<PostContent>(defaultContent);
  
  // Save/Load state
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [currentPostTitle, setCurrentPostTitle] = useState<string>("");
  const [currentPostStatus, setCurrentPostStatus] = useState<'draft' | 'published'>('draft');
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPostsList, setShowPostsList] = useState(false);
  
  // Ref to access PostPreview's renderToCanvas
  const previewRef = useRef<{ renderToCanvas: () => Promise<HTMLCanvasElement> } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Access Denied",
            description: "Please log in to access this page",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        // Check for admin or superadmin role
        const { is_admin } = await checkUserAdminStatus(user.id);

        if (!is_admin) {
          toast({
            title: "Access Denied",
            description: "This feature is only available to admins",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        setUserId(user.id);
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Load saved posts
  const loadSavedPosts = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('created_by', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSavedPosts((data || []) as SavedPost[]);
    } catch (error) {
      console.error('Error loading saved posts:', error);
      toast({
        title: "Error",
        description: "Failed to load saved posts",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (isAuthorized && userId) {
      loadSavedPosts();
    }
  }, [isAuthorized, userId, loadSavedPosts]);

  // Generate thumbnail from current content
  const generateThumbnail = async (): Promise<string | null> => {
    try {
      // Create a simple canvas-based thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      
      // Draw background
      const gradient = ctx.createLinearGradient(0, 0, 400, 400);
      if (content.backgroundStyle === "hero-style") {
        gradient.addColorStop(0, "#0d1b3e");
        gradient.addColorStop(1, "#1a1a2e");
      } else if (content.backgroundStyle === "neon-accent") {
        gradient.addColorStop(0, "#0a0a0f");
        gradient.addColorStop(1, "#1a1a2e");
      } else {
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#0d1b3e");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);
      
      // Draw simplified text
      ctx.font = "bold 24px Poppins, sans-serif";
      ctx.fillStyle = "#00d4ff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const headline = content.headline || "Untitled Post";
      const truncated = headline.length > 30 ? headline.substring(0, 30) + "..." : headline;
      ctx.fillText(truncated, 200, 200);
      
      // Upload thumbnail to Cloudinary
      const thumbnailUrl = await uploadCanvasToCloudinary(canvas, `instagram-posts/${userId}`);
      return thumbnailUrl;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  };

  // Save post
  const handleSave = async (title: string, status: 'draft' | 'published') => {
    if (!userId) return;

    try {
      // Upload content JSON to Cloudinary
      const contentUrl = await uploadJsonToCloudinary(content, `instagram-posts/${userId}`);
      
      // Generate and upload thumbnail
      const thumbnailUrl = await generateThumbnail();

      if (currentPostId) {
        // Update existing post
        const { error } = await supabase
          .from('instagram_posts')
          .update({
            title,
            status,
            content_url: contentUrl,
            thumbnail_url: thumbnailUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentPostId);

        if (error) throw error;
        
        setCurrentPostTitle(title);
        setCurrentPostStatus(status);
        
        toast({
          title: "Post Updated",
          description: `"${title}" has been saved`,
        });
      } else {
        // Create new post
        const { data, error } = await supabase
          .from('instagram_posts')
          .insert({
            created_by: userId,
            title,
            status,
            content_url: contentUrl,
            thumbnail_url: thumbnailUrl,
          })
          .select()
          .single();

        if (error) throw error;
        
        setCurrentPostId(data.id);
        setCurrentPostTitle(title);
        setCurrentPostStatus(status);
        
        toast({
          title: "Post Saved",
          description: `"${title}" has been created`,
        });
      }
      
      // Refresh the list
      await loadSavedPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the post. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Load post
  const handleLoadPost = async (post: SavedPost) => {
    try {
      const loadedContent = await fetchJsonFromCloudinary<PostContent>(post.content_url);
      setContent(loadedContent);
      setCurrentPostId(post.id);
      setCurrentPostTitle(post.title);
      setCurrentPostStatus(post.status);
      
      toast({
        title: "Post Loaded",
        description: `"${post.title}" is ready to edit`,
      });
    } catch (error) {
      console.error('Error loading post:', error);
      toast({
        title: "Load Failed",
        description: "Could not load the post content",
        variant: "destructive",
      });
    }
  };

  // Duplicate post
  const handleDuplicatePost = async (post: SavedPost) => {
    try {
      const loadedContent = await fetchJsonFromCloudinary<PostContent>(post.content_url);
      setContent(loadedContent);
      setCurrentPostId(null);
      setCurrentPostTitle("");
      setCurrentPostStatus('draft');
      
      toast({
        title: "Post Duplicated",
        description: `Copy of "${post.title}" created. Save to keep it.`,
      });
    } catch (error) {
      console.error('Error duplicating post:', error);
      toast({
        title: "Duplicate Failed",
        description: "Could not duplicate the post",
        variant: "destructive",
      });
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('instagram_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      // If we deleted the current post, reset
      if (postId === currentPostId) {
        setCurrentPostId(null);
        setCurrentPostTitle("");
        setCurrentPostStatus('draft');
      }
      
      toast({
        title: "Post Deleted",
        description: "The post has been removed",
      });
      
      await loadSavedPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the post",
        variant: "destructive",
      });
      throw error;
    }
  };

  // New post
  const handleNewPost = () => {
    setContent(defaultContent);
    setCurrentPostId(null);
    setCurrentPostTitle("");
    setCurrentPostStatus('draft');
    
    toast({
      title: "New Post",
      description: "Started a fresh post",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4">
            <SpinningPaws size="lg" />
            <div>Verifying permissions...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <Header activeSection="profile" onSectionChange={() => navigate('/profile')} />
      <div className="min-h-screen bg-background pt-20 px-4 pb-8">
        <div className="container mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Instagram Post Generator</h1>
              <p className="text-muted-foreground">
                {currentPostId ? (
                  <>Editing: <span className="font-medium text-foreground">{currentPostTitle}</span></>
                ) : (
                  'Create branded posts for social media'
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewPost}
              >
                <FilePlus className="w-4 h-4 mr-2" />
                New
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPostsList(true)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                My Posts
              </Button>
              <Button
                size="sm"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                {currentPostId ? 'Save' : 'Save As'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <PostEditor content={content} onChange={setContent} />
            <div className="lg:sticky lg:top-24 lg:self-start">
              <PostPreview 
                content={content} 
                onPositionChange={(pos) => setContent(prev => ({ ...prev, textPosition: pos }))}
              />
            </div>
          </div>
        </div>
      </div>

      <SavePostDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSave}
        initialTitle={currentPostTitle}
        initialStatus={currentPostStatus}
        isUpdate={!!currentPostId}
      />

      <SavedPostsList
        open={showPostsList}
        onOpenChange={setShowPostsList}
        posts={savedPosts}
        isLoading={isLoadingPosts}
        onLoad={handleLoadPost}
        onDuplicate={handleDuplicatePost}
        onDelete={handleDeletePost}
      />
    </>
  );
};

export default InstagramPostGenerator;
