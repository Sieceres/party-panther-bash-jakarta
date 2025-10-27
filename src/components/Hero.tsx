import { Button } from "@/components/ui/button";
import { Calendar, Zap, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  onSectionChange: (section: string) => void;
}

export const Hero = ({ onSectionChange }: HeroProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    events: 0,
    promos: 0,
    partyGoers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch events count
        const { count: eventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });

        // Fetch promos count
        const { count: promosCount } = await supabase
          .from('promos')
          .select('*', { count: 'exact', head: true });

        // Fetch party goers count (total unique users who have joined events)
        const { count: partyGoersCount } = await supabase
          .from('event_attendees')
          .select('user_id', { count: 'exact', head: true });

        setStats({
          events: eventsCount || 0,
          promos: promosCount || 0,
          partyGoers: partyGoersCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default values if error occurs
        setStats({
          events: 500,
          promos: 1000,
          partyGoers: 50000
        });
      }
    };

    fetchStats();
  }, []);
  return (
    <section className="relative min-h-[85vh] sm:min-h-[88vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Hero edge glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 hero-edge-glow"></div>
      </div>
      {/* Vibrant Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e] via-[#1a1a2e] to-[#0d1b3e]">
        <div className="absolute inset-0 animated-hero-gradient"></div>
        {/* Text readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      </div>

      {/* Moving Light Streaks - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="light-streak light-streak-1"></div>
        <div className="light-streak light-streak-2"></div>
        <div className="light-streak light-streak-3"></div>
        {/* Additional diagonal streaks for more vibrance */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-10 left-0 w-64 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
          <div className="absolute top-1/3 right-0 w-48 h-[2px] bg-gradient-to-l from-transparent via-blue-400 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/4 w-56 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="floating-element absolute top-20 left-10 w-20 h-20 rounded-full party-gradient blur-sm"></div>
        <div className="floating-element absolute top-40 right-20 w-16 h-16 rounded-full bg-neon-cyan blur-sm"></div>
        <div className="floating-element absolute bottom-40 left-20 w-24 h-24 rounded-full bg-neon-indigo blur-sm"></div>
        <div className="floating-element absolute bottom-20 right-10 w-18 h-18 rounded-full bg-neon-green blur-sm"></div>
        
        {/* Geometric shapes */}
        <div className="floating-element absolute top-1/3 left-1/4 w-32 h-32 rotate-45 border-2 border-neon-blue opacity-20"></div>
        <div className="floating-element absolute bottom-1/3 right-1/4 w-40 h-40 rotate-12 border-2 border-neon-cyan opacity-15"></div>
      </div>

      {/* Particle Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-particle hero-particle-1"></div>
        <div className="hero-particle hero-particle-2"></div>
        <div className="hero-particle hero-particle-3"></div>
        <div className="hero-particle hero-particle-4"></div>
        <div className="hero-particle hero-particle-5"></div>
        <div className="hero-particle hero-particle-6"></div>
      </div>

      <div className="relative z-20 text-center space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 px-4 sm:px-6 md:px-8 animate-fade-in max-w-5xl mx-auto py-6 sm:py-8">
        {/* Main Title */}
        <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          <h1 
            className="font-extrabold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent animate-slide-up break-words" 
            style={{
              fontSize: 'clamp(2rem, 5vw + 0.5rem, 4rem)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              filter: 'drop-shadow(0 0 20px rgba(0, 207, 255, 0.5)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.9))'
            }}
          >
           Party Panther
          </h1>
          <p 
            className="text-white font-semibold animate-slide-up hero-subtitle break-words px-2" 
            style={{ 
              animationDelay: '0.2s',
              fontSize: 'clamp(1rem, 2.5vw + 0.25rem, 1.5rem)',
              lineHeight: '1.4',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 207, 255, 0.3)'
            }}
          >
            Jakarta's Ultimate Party & Promo Hub
          </p>
          <p 
            className="text-white/90 max-w-2xl mx-auto animate-slide-up hero-subtitle break-words px-2" 
            style={{ 
              animationDelay: '0.4s',
              fontSize: 'clamp(0.875rem, 1.5vw + 0.25rem, 1.125rem)',
              lineHeight: '1.6',
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 0, 0, 0.5)'
            }}
          >
            Discover promos that make you purr, events that make you roar, and connect with other Party Panthers in Jakarta
          </p>
        </div>

        {/* Stats - Hidden temporarily */}
        {/* <div className="flex justify-center space-x-8 mb-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">{stats.events}+</div>
            <div className="text-sm text-muted-foreground">Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">{stats.promos}+</div>
            <div className="text-sm text-muted-foreground">Promos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">{stats.partyGoers > 1000 ? `${Math.floor(stats.partyGoers / 1000)}K+` : `${stats.partyGoers}+`}</div>
            <div className="text-sm text-white/70">Party People</div>
          </div>
        </div> */}

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 md:pt-6 lg:pt-8 animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 max-w-md sm:max-w-none">
            <Button
              size="lg"
              onClick={() => onSectionChange('promos')}
              className="cta-button group w-full sm:w-auto min-h-[48px]"
              style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 group-hover:rotate-12 transition-transform" />
              <span className="truncate">Find Hot Promos</span>
            </Button>
            <Button
              size="lg"
              onClick={() => onSectionChange('events')}
              className="cta-button group w-full sm:w-auto min-h-[48px]"
              style={{ fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 group-hover:bounce transition-transform" />
              <span className="truncate">Explore Events</span>
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
};
