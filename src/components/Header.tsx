import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Star, User, LogIn, LogOut, BookOpen, Home, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" onClick={() => onSectionChange('home')}>
            <div className="w-10 h-10 rounded-full party-gradient flex items-center justify-center p-1">
              <img src="/lovable-uploads/f28f26bd-95f6-4171-b7b8-042f10b8bb1b.png" alt="Party Panther Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex items-baseline gap-1">
              <h1 className="text-lg font-bold gradient-text">Party Panther</h1>
              <span className="text-sm font-serif text-red-500 transform -rotate-12 font-bold">BETA</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
           <nav className="hidden md:flex items-center space-x-1 relative z-10">
             {menuItems.filter(item => !item.hidden).map((item) => {
               const Icon = item.icon;
               return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    onClick={() => {
                      // Check if user is trying to access profile without being authenticated
                      if (item.id === 'profile' && !user) {
                        navigate('/auth');
                        return;
                      }
                      
                      // Use proper navigation based on item type
                      if (item.id === 'profile') {
                        navigate('/profile');
                      } else {
                        navigate('/');
                        onSectionChange(item.id);
                      }
                    }}
                    className={`flex items-center space-x-2 transition-all ${
                      activeSection === item.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-gradient-to-r hover:from-neon-blue hover:to-neon-cyan hover:text-white"
                    }`}
                 >
                   <Icon className="w-4 h-4" />
                   <span>{item.label}</span>
                 </Button>
               );
             })}
             {/* Auth Button */}
              {user ? (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 relative z-10 border-secondary text-secondary-foreground hover:bg-secondary"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="flex items-center space-x-2 relative z-10 bg-gradient-to-r from-neon-blue to-neon-cyan text-white hover:opacity-90"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In/Sign Up</span>
                </Button>
              )}
           </nav>

          {/* Mobile Menu Button */}
<Button
  variant="ghost"
  size="sm"
  className="md:hidden text-foreground hover:text-primary"
  onClick={() => setIsMenuOpen(!isMenuOpen)}
>
  <div className="w-6 h-6 flex flex-col justify-center space-y-1">
    <div className="w-full h-0.5 bg-foreground"></div>
    <div className="w-full h-0.5 bg-foreground"></div>
    <div className="w-full h-0.5 bg-foreground"></div>
  </div>
</Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              {menuItems.filter(item => !item.hidden).map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                     key={item.id}
                     variant={activeSection === item.id ? "default" : "ghost"}
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
                       } else {
                         navigate('/');
                         onSectionChange(item.id);
                       }
                       setIsMenuOpen(false);
                     }}
                    className="justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
              
               {/* Mobile Auth Button */}
               {user ? (
                 <Button
                   variant="ghost"
                   onClick={() => {
                     handleSignOut();
                     setIsMenuOpen(false);
                   }}
                   className="justify-start mt-2"
                 >
                   <LogOut className="w-4 h-4 mr-2" />
                   Sign Out
                 </Button>
               ) : (
                 <Button
                   onClick={() => {
                     navigate('/auth');
                     setIsMenuOpen(false);
                   }}
                   className="justify-start mt-2 bg-gradient-to-r from-neon-blue to-neon-cyan text-white"
                 >
                   <LogIn className="w-4 h-4 mr-2" />
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
