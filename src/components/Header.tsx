import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Star, User, LogIn, LogOut, BookOpen, Home, Zap, Shield, Map, Store, Bell, Flag, Building2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/party-panther-logo.png";

interface HeaderProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export const Header = ({ activeSection = '', onSectionChange }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingReportCount, setPendingReportCount] = useState(0);
  const [pendingClaimCount, setPendingClaimCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        checkAdminStatus(session?.user?.id);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'superadmin']);

      if (error) {
        console.error('Error checking roles:', error);
        setIsAdmin(false);
        return;
      }

      const adminStatus = roles && roles.length > 0;
      setIsAdmin(adminStatus);
      if (adminStatus) {
        fetchPendingCounts();
      }
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setIsAdmin(false);
    }
  };

  const fetchPendingCounts = async () => {
    try {
      const [reportsRes, claimsRes] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('venue_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      if (!reportsRes.error && reportsRes.count !== null) setPendingReportCount(reportsRes.count);
      if (!claimsRes.error && claimsRes.count !== null) setPendingClaimCount(claimsRes.count);
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

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
        onSectionChange?.('home');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const ROUTE_MAP: Record<string, string> = {
    home: '/',
    events: '/events',
    promos: '/promos',
    venues: '/venues',
    admin: '/admin',
    profile: '/profile',
    map: '/map',
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, hidden: false },
    { id: 'promos', label: 'Promos', icon: Zap, hidden: false },
    { id: 'events', label: 'Events', icon: Calendar, hidden: false },
    { id: 'venues', label: 'Venues', icon: Store, hidden: false },
    { id: 'map', label: 'Map', icon: Map, hidden: false },
    { id: 'profile', label: 'Profile', icon: User, hidden: false },
    { id: 'admin', label: 'Admin', icon: Shield, hidden: !isAdmin }
  ];

  const handleNavClick = (itemId: string, closeMobile = false) => {
    if (itemId === 'profile' && !user) {
      navigate('/auth');
      if (closeMobile) setIsMenuOpen(false);
      return;
    }
    const route = ROUTE_MAP[itemId] || '/';
    navigate(route);
    onSectionChange?.(itemId);
    if (closeMobile) setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1100] bg-background/60 backdrop-blur-lg border-b border-border/30">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex items-center justify-between h-16 sm:h-18">
           {/* Logo */}
          <Link to="/" className="flex items-center gap-0" onClick={() => onSectionChange?.('home')}>
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
                        onClick={() => handleNavClick(item.id)}
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
              {/* Notification Bell for Admins */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => navigate('/admin?tab=reports')}
                  className="relative flex items-center gap-1 text-sm"
                  title="Pending reports"
                >
                  <Bell className="w-4 h-4" />
                  {pendingReportCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingReportCount > 99 ? '99+' : pendingReportCount}
                    </span>
                  )}
                </Button>
              )}
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
                      onClick={() => handleNavClick(item.id, true)}
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
