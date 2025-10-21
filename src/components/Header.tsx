import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Star, User, LogIn, LogOut, BookOpen, Home, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/party-panther-logo.png";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Header = ({ activeSection, onSectionChange }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
        onSectionChange('home');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, hidden: false },
    { id: 'promos', label: 'Promos', icon: Zap, hidden: false },
    { id: 'events', label: 'Events', icon: Calendar, hidden: false },
    { id: 'profile', label: 'Profile', icon: User, hidden: false }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
           {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5" onClick={() => onSectionChange('home')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center flex-shrink-0">
              <img src={logoImage} alt="Party Panther Logo" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,207,255,0.4)]" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-extrabold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,207,255,0.4)] whitespace-nowrap">
                Party Panther
              </h1>
              <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] md:text-xs font-bold text-white bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] rounded-full shadow-[0_0_12px_rgba(0,207,255,0.4)] flex-shrink-0">
                BETA
              </span>
            </div>
          </Link>

           {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2 relative z-10">
             {menuItems.filter(item => !item.hidden).map((item) => {
               const Icon = item.icon;
               return (
                   <Button
                     key={item.id}
                     variant={activeSection === item.id ? "default" : "ghost"}
                     size="default"
                     onClick={() => {
                       // Check if user is trying to access profile without being authenticated
                       if (item.id === 'profile' && !user) {
                         navigate('/auth');
                         return;
                       }
                       
                       // Use proper navigation based on item type
                       if (item.id === 'profile') {
                         navigate('/profile');
                       } else if (item.id === 'home') {
                         navigate('/');
                       } else {
                         navigate(`/?section=${item.id}`);
                       }
                       onSectionChange(item.id);
                     }}
                     className={`flex items-center gap-2 transition-all text-sm ${
                       activeSection === item.id 
                         ? "bg-primary text-primary-foreground" 
                         : "hover:bg-gradient-to-r hover:from-neon-blue hover:to-neon-cyan hover:text-white"
                     }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Button>
               );
             })}
              {/* Auth Button */}
              {user ? (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 relative z-10 border-secondary text-secondary-foreground hover:bg-secondary text-sm"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Sign Out</span>
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 relative z-10 bg-gradient-to-r from-neon-blue to-neon-cyan text-white hover:opacity-90 text-sm"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Sign In/Sign Up</span>
                </Button>
              )}
           </nav>

          {/* Mobile & Tablet Menu Button */}
<Button
  variant="ghost"
  size="default"
  className="lg:hidden text-foreground hover:text-primary min-w-[44px] min-h-[44px]"
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
>
  <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
    <div className={`w-full h-0.5 bg-foreground transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
    <div className={`w-full h-0.5 bg-foreground transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></div>
    <div className={`w-full h-0.5 bg-foreground transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
  </div>
</Button>
        </div>

        {/* Mobile & Tablet Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              {menuItems.filter(item => !item.hidden).map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                     key={item.id}
                     variant={activeSection === item.id ? "default" : "ghost"}
                     size="lg"
                     onClick={() => {
                       // Check if user is trying to access profile without being authenticated
                       if (item.id === 'profile' && !user) {
                         navigate('/auth');
                         setIsMenuOpen(false);
                         return;
                       }
                       
                       // Use proper navigation based on item type
                       if (item.id === 'profile') {
                         navigate('/profile');
                       } else if (item.id === 'home') {
                         navigate('/');
                       } else {
                         navigate(`/?section=${item.id}`);
                       }
                       onSectionChange(item.id);
                        setIsMenuOpen(false);
                      }}
                     className="justify-start min-h-[44px] text-base"
                   >
                     <Icon className="w-5 h-5 mr-3" />
                     {item.label}
                   </Button>
                );
              })}
              
               {/* Mobile Auth Button */}
               {user ? (
                 <Button
                   variant="ghost"
                   size="lg"
                   onClick={() => {
                     handleSignOut();
                     setIsMenuOpen(false);
                   }}
                   className="justify-start mt-2 min-h-[44px] text-base"
                 >
                   <LogOut className="w-5 h-5 mr-3" />
                   Sign Out
                 </Button>
               ) : (
                 <Button
                   size="lg"
                   onClick={() => {
                     navigate('/auth');
                     setIsMenuOpen(false);
                   }}
                   className="justify-start mt-2 bg-gradient-to-r from-neon-blue to-neon-cyan text-white min-h-[44px] text-base"
                 >
                   <LogIn className="w-5 h-5 mr-3" />
                   Sign In/Sign Up
                 </Button>
               )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
