import { Button } from "@/components/ui/button";
import { Calendar, Star, Sparkles } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import floatingElements from "@/assets/floating-elements.png";

interface HeroProps {
  onSectionChange: (section: string) => void;
}

export const Hero = ({ onSectionChange }: HeroProps) => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 hero-bg"></div>
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
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-neon-indigo rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-neon-green rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/3 right-1/2 w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 text-center space-y-8 px-4 animate-fade-in">
        {/* Main Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-20 h-20 rounded-full party-gradient flex items-center justify-center animate-glow p-2">
              <img src="/lovable-uploads/f28f26bd-95f6-4171-b7b8-042f10b8bb1b.png" alt="Party Panther Logo" className="w-full h-full object-contain -ml-1" />
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-4 animate-slide-up">
            Party Panther
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Jakarta's Ultimate Party & Promo Hub
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
            Discover the hottest events, exclusive promos, and connect with Jakarta's vibrant nightlife community
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center space-x-8 mb-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">500+</div>
            <div className="text-sm text-muted-foreground">Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">1000+</div>
            <div className="text-sm text-muted-foreground">Promos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text">50K+</div>
            <div className="text-sm text-muted-foreground">Party Goers</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <Button
            size="lg"
            onClick={() => onSectionChange('promos')}
            className="group bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
          >
            <Star className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            Find Hot Promos
            <Sparkles className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
          </Button>
          <Button
            size="lg"
            onClick={() => onSectionChange('events')}
            className="group bg-gradient-to-r from-neon-blue to-neon-cyan text-white font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/25"
          >
            <Calendar className="w-5 h-5 mr-2 group-hover:bounce transition-transform" />
            Explore Events
          </Button>
        </div>

      </div>
    </section>
  );
};