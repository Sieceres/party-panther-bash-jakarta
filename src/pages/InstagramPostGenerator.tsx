import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { PostEditor } from "@/components/instagram/PostEditor";
import { PostPreview } from "@/components/instagram/PostPreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import type { PostContent } from "@/types/instagram-post";

const InstagramPostGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [content, setContent] = useState<PostContent>({
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
  });

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

        // Check for superadmin role only
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'superadmin');

        if (error || !roles || roles.length === 0) {
          toast({
            title: "Access Denied",
            description: "This feature is only available to super admins",
            variant: "destructive"
          });
          navigate('/admin');
          return;
        }

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Instagram Post Generator</h1>
              <p className="text-muted-foreground">Create branded posts for social media</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PostEditor content={content} onChange={setContent} />
            <PostPreview content={content} />
          </div>
        </div>
      </div>
    </>
  );
};

export default InstagramPostGenerator;
