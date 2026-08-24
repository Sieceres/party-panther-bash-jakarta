import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";

const GOOGLE_CLIENT_ID =
  "900992276408-mmaa6o6t4dom10rm3b6r9tvin4jcgdu0.apps.googleusercontent.com";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LoginDialog = ({ open, onOpenChange, onSuccess }: LoginDialogProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [authTab, setAuthTab] = useState("signin");
  const { toast } = useToast();

  // Register global callback for Google Identity Services HTML API.
  useEffect(() => {
    (window as any).handleGoogleSignInToken = async (response: { credential: string }) => {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        if (error) throw error;
        console.log("Login successful!", data.user);
        toast({ title: "Login successful", description: "" });
        onOpenChange(false);
        onSuccess?.();
      } catch (e: any) {
        console.error("Supabase auth error:", e?.message);
        toast({
          title: "Google sign-in failed",
          description: e?.message || "Please try again or use email.",
          variant: "destructive",
        });
      }
    };
    return () => {
      try {
        delete (window as any).handleGoogleSignInToken;
      } catch {
        (window as any).handleGoogleSignInToken = undefined;
      }
    };
  }, [onOpenChange, onSuccess, toast]);

  // When the dialog opens, (re)render the Google button(s) inside it.
  useEffect(() => {
    if (!open) {
      document.querySelectorAll<HTMLDivElement>(".g_id_signin").forEach((element) => {
        element.replaceChildren();
      });
      document.getElementById("credential_picker_container")?.remove();
      return;
    }
    let cancelled = false;
    const render = () => {
      if (cancelled) return;
      const g = (window as any).google;
      if (!g?.accounts?.id) {
        setTimeout(render, 150);
        return;
      }
      try {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (window as any).handleGoogleSignInToken,
          ux_mode: "popup",
          context: "signin",
          itp_support: true,
        });
      } catch (err) {
        console.error("Google init failed:", err);
        return;
      }
      const targets = document.querySelectorAll<HTMLDivElement>(".g_id_signin");
      if (targets.length === 0) {
        setTimeout(render, 100);
        return;
      }
      targets.forEach((el) => {
        el.innerHTML = "";
        try {
          g.accounts.id.renderButton(el, {
            type: "standard",
            shape: "rectangular",
            theme: "outline",
            text: "signin_with",
            size: "large",
            logo_alignment: "left",
            width: 320,
          });
        } catch (err) {
          console.error("Google button render failed:", err);
        }
      });
    };
    // Slight delay so dialog content mounts first
    const t = setTimeout(render, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
      document.getElementById("credential_picker_container")?.remove();
    };
  }, [open, authTab]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName
          }
        }
      });

      const alreadyExists =
        (error && (error.message.includes("User already registered") || error.message.toLowerCase().includes("already"))) ||
        (!error && data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);

      if (alreadyExists) {
        toast({
          title: "Email already registered",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
        setAuthTab("signin");
      } else if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {

        toast({
          title: "Check your email!",
          description: "We've sent you a confirmation link. Please verify your email to complete signup.",
          duration: 6000,
        });
        onOpenChange(false);
        setEmail("");
        setPassword("");
        setDisplayName("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else if (error.message.includes("fetch")) {
          toast({
            title: "Connection Error",
            description: "Unable to connect to the server. Please check your internet connection and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Login successful",
          description: "",
        });
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Sign in catch error:', error);
      const message = error?.message || "An unexpected error occurred";
      toast({
        title: "Error",
        description: message.includes("fetch") 
          ? "Unable to connect to the server. Please check your internet connection and try again."
          : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center gradient-text">Join Party Panther</DialogTitle>
        </DialogHeader>
        
        <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="g_id_signin w-full flex justify-center min-h-[40px]" />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-signin-email">Email</Label>
                <Input
                  id="dialog-signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-signin-password">Password</Label>
                <Input
                  id="dialog-signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="g_id_signin w-full flex justify-center min-h-[40px]" />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-signup-name">Display Name</Label>
                <Input
                  id="dialog-signup-name"
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-signup-email">Email</Label>
                <Input
                  id="dialog-signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-signup-password">Password</Label>
                <Input
                  id="dialog-signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                By signing up, you agree to the{" "}
                <Link to="/terms-conditions" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      <ForgotPasswordDialog 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen} 
      />
    </Dialog>
  );
};
