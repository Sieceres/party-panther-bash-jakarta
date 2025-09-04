import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect to home if user is authenticated
        if (session?.user) {
          navigate("/");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
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
          title: "Success",
          description: "Please check your email to confirm your account.",
        });
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
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
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

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">Jakarta Nightlife</CardTitle>
          <CardDescription>
            Join the hottest party scene in Jakarta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Social Authentication Options */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('google')}
                disabled={loading}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('facebook')}
                disabled={loading}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('apple')}
                disabled={loading}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C8.396 0 8.02.15 7.712.357c-.809.542-1.296 1.568-.817 3.24.479 1.672 1.129 2.417 1.904 3.098C9.15 7.108 10.4 7.5 12.017 7.5c1.617 0 2.867-.392 3.218-.805.775-.681 1.425-1.426 1.904-3.098.48-1.672-.008-2.698-.817-3.24C16.014.151 15.638.001 12.017.001zm2.283 10.356c-.256-.101-.5-.214-.737-.34l-.416-.22c-.168-.091-.33-.185-.49-.282-.32-.195-.624-.403-.91-.623-.143-.11-.28-.223-.414-.339-.133-.115-.26-.233-.38-.354-.24-.242-.46-.497-.66-.765-.1-.134-.194-.271-.282-.41-.176-.278-.326-.567-.45-.866-.062-.15-.118-.301-.168-.454-.1-.306-.172-.618-.215-.933-.022-.157-.036-.315-.044-.473-.016-.316-.016-.632.016-.946.016-.157.04-.312.072-.466.064-.308.156-.61.276-.902.06-.146.126-.289.2-.429.148-.28.32-.547.516-.798.098-.125.202-.246.312-.363.22-.234.464-.448.728-.64.132-.096.27-.184.412-.267.284-.166.583-.305.894-.416.155-.056.314-.105.474-.148.32-.086.646-.15.974-.19.164-.02.328-.032.493-.037.33-.01.66.002.988.037.164.017.326.043.487.077.322.068.637.16.944.274.153.057.305.12.453.19.296.14.579.306.844.496.133.095.26.196.382.302.244.212.468.444.67.692.101.124.196.252.284.384.176.264.33.54.462.826.066.143.125.289.177.437.104.296.184.599.24.906.028.154.048.308.061.463.026.31.032.622.018.932-.007.155-.02.309-.04.462-.04.306-.1.608-.18.904-.04.148-.086.294-.138.438-.104.288-.23.568-.378.836-.074.134-.154.265-.24.392-.172.254-.366.492-.582.714-.108.111-.222.217-.34.318-.236.202-.488.384-.754.544-.133.08-.27.154-.41.223-.28.138-.572.254-.872.348-.15.047-.302.089-.456.125-.308.072-.622.124-.938.155-.158.015-.316.024-.475.026-.318.004-.635-.008-.95-.036-.158-.014-.314-.035-.469-.062-.31-.054-.614-.13-.912-.228-.149-.049-.296-.104-.441-.164-.29-.12-.569-.264-.835-.432-.133-.084-.261-.173-.384-.268-.246-.19-.472-.402-.678-.634-.103-.116-.2-.236-.291-.36-.182-.248-.343-.509-.483-.782-.07-.136-.133-.276-.189-.418-.112-.284-.202-.576-.269-.873-.033-.149-.061-.298-.082-.449-.042-.302-.064-.607-.066-.912-.001-.153.003-.306.012-.458.018-.304.056-.605.114-.902.029-.148.064-.295.104-.44.08-.29.184-.572.312-.844.064-.136.134-.269.21-.399.152-.26.326-.506.522-.736.098-.115.202-.225.312-.33.22-.21.461-.396.722-.558.130-.081.266-.155.407-.223.282-.136.576-.248.878-.335.151-.043.304-.081.458-.113.308-.064.619-.108.932-.131.156-.012.313-.017.47-.015.314.004.627.028.937.072.155.022.308.051.46.087.304.072.601.168.888.288.144.06.285.126.424.198.278.144.543.312.794.502.125.095.245.195.36.3.23.21.44.441.63.688.095.123.184.251.267.382.166.262.312.536.437.82.062.142.118.287.168.433.1.292.178.591.233.894.027.152.047.304.061.457.028.306.035.613.021.918-.007.153-.02.305-.039.456-.038.302-.096.601-.174.893-.039.146-.083.291-.133.434-.1.286-.222.564-.366.831-.072.133-.15.263-.233.39-.166.254-.354.493-.564.717-.105.112-.216.219-.332.321-.232.204-.48.388-.742.551-.131.081-.267.157-.407.227-.28.14-.571.259-.871.355-.15.048-.302.091-.455.128-.306.074-.617.127-.931.159-.157.016-.315.025-.473.028-.316.006-.632-.004-.946-.03-.157-.013-.313-.033-.467-.058-.308-.05-.611-.122-.908-.216-.149-.047-.295-.1-.439-.158-.288-.116-.565-.255-.828-.415-.131-.08-.258-.165-.38-.255-.244-.18-.468-.381-.672-.601-.102-.110-.198-.224-.288-.342-.180-.236-.338-.485-.475-.746-.069-.131-.131-.265-.186-.401-.11-.272-.198-.551-.258-.834-.030-.141-.055-.283-.073-.426-.036-.286-.052-.574-.048-.861.002-.144.01-.287.022-.429.024-.284.068-.564.132-.839.032-.137.069-.273.112-.407.086-.268.193-.528.32-.777.064-.125.133-.246.208-.364.15-.236.318-.461.504-.671.093-.105.192-.205.296-.299.208-.188.431-.357.668-.505.118-.074.24-.142.365-.205.25-.126.509-.233.775-.321.133-.044.268-.083.404-.117.272-.068.548-.118.826-.149.139-.016.278-.026.418-.031.279-.01.558-.004.836.018.139.011.277.027.414.049.274.044.544.108.808.192.132.042.262.089.39.142.256.106.504.232.742.378.119.073.234.151.345.234.222.166.428.351.618.552.095.101.185.205.270.313.170.216.322.444.456.684.067.12.128.243.183.368.110.25.202.508.275.772.037.132.068.265.094.399.052.268.084.539.096.811.006.136.007.272.003.408.008.272-.012.544-.046.814-.017.135-.04.269-.069.401-.058.264-.134.524-.228.777-.047.127-.099.252-.157.375-.116.246-.252.483-.408.708-.078.113-.161.222-.249.328-.176.212-.37.408-.582.588-.106.090-.217.175-.332.255-.230.160-.476.301-.735.422-.129.061-.262.116-.396.166-.268.100-.544.183-.824.247-.140.032-.281.059-.423.081-.284.044-.571.069-.859.075-.144.003-.288.001-.432-.006-.288-.014-.574-.048-.857-.101-.141-.027-.281-.059-.419-.097-.276-.076-.546-.172-.808-.288-.131-.058-.259-.122-.385-.192-.252-.140-.493-.300-.722-.481-.114-.091-.224-.187-.330-.288-.212-.202-.404-.422-.576-.658-.086-.118-.166-.240-.240-.365-.148-.250-.275-.512-.381-.783-.053-.135-.101-.273-.143-.413-.084-.279-.146-.564-.185-.852-.020-.144-.034-.289-.042-.434-.016-.291-.012-.582.013-.872.013-.145.031-.289.055-.432.048-.286.116-.568.204-.843.044-.137.093-.273.148-.406.110-.266.241-.522.394-.766.077-.122.158-.241.246-.356.176-.230.372-.444.588-.640.108-.098.221-.191.339-.279.236-.176.488-.333.752-.469.132-.068.267-.131.406-.189.278-.116.566-.213.861-.289.147-.038.296-.071.446-.099.300-.056.603-.092.908-.108.153-.008.306-.01.459-.007.306.006.611.032.914.078.152.023.302.052.451.087.298.070.590.161.873.273.142.056.282.118.419.185.274.134.537.288.787.463.125.088.246.182.362.281.232.198.444.417.636.653.096.118.186.241.270.368.168.254.316.521.443.799.063.139.121.281.174.424.106.286.191.579.254.877.032.149.058.299.078.449.040.300.060.602.060.904 0 .151-.003.302-.01.453-.014.302-.048.602-.102.899-.027.149-.060.296-.098.442-.076.292-.172.578-.288.855-.058.139-.121.275-.191.409-.140.268-.300.524-.479.767-.090.122-.185.240-.285.354-.200.228-.418.439-.654.632-.118.097-.241.188-.369.274-.256.172-.526.325-.808.456-.141.066-.286.126-.433.181-.294.110-.596.200-.905.269-.154.035-.310.064-.467.088-.314.048-.632.077-.950.087-.159.005-.318.005-.477-.001-.318-.012-.634-.044-.948-.096-.157-.026-.313-.058-.467-.096-.308-.076-.610-.173-.904-.291-.147-.059-.292-.123-.435-.193-.286-.140-.561-.301-.823-.483-.131-.091-.258-.188-.381-.290-.246-.204-.472-.428-.677-.669-.103-.121-.200-.246-.291-.375-.182-.258-.342-.528-.480-.809-.069-.141-.131-.284-.187-.429-.112-.290-.203-.587-.273-.890-.035-.151-.064-.304-.087-.458-.046-.308-.072-.619-.078-.930-.003-.156-.001-.311.006-.467.014-.311.049-.621.104-.927.028-.153.061-.305.100-.455.078-.300.177-.593.296-.878.059-.142.124-.282.194-.419.140-.274.300-.536.479-.785.090-.125.185-.246.286-.363.202-.234.422-.452.660-.651.119-.099.243-.193.371-.282.256-.178.526-.337.808-.477.141-.070.286-.135.433-.194.294-.118.596-.217.905-.295.154-.039.310-.073.468-.101.316-.056.635-.092.955-.108.16-.008.321-.01.481-.006z"/>
                </svg>
                Continue with Apple
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                By signing up, you agree to the{" "}
                <a href="/terms-conditions" className="text-primary hover:underline">
                  Terms & Conditions
                </a>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;