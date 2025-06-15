import { Button } from "@/components/ui/button";
import { Calendar, Star } from "lucide-react";

interface HeroProps {
  onSectionChange: (section: string) => void;
}

export const Hero = ({ onSectionChange }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full party-gradient blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-cyan blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-neon-indigo blur-3xl opacity-15"></div>
      </div>

      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Main Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full party-gradient flex items-center justify-center">
              <span className="text-4xl">🐾</span>
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-4">
            Party Panther
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            Jakarta's Ultimate Party & Promo Hub
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the hottest events, exclusive promos, and connect with Jakarta's vibrant nightlife community
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button
            size="lg"
            onClick={() => onSectionChange('events')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-full"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Explore Events
          </Button>
          <Button
            size="lg"
            onClick={() => onSectionChange('promos')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-full"
          >
            <Star className="w-5 h-5 mr-2" />
            Find Promos
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 pt-16 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-neon-blue">500+</div>
            <div className="text-sm text-muted-foreground">Events</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-neon-cyan">200+</div>
            <div className="text-sm text-muted-foreground">Venues</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-neon-indigo">1000+</div>
            <div className="text-sm text-muted-foreground">Members</div>
          </div>
        </div>
      </div>
    </section>
  );
};