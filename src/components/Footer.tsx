import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

interface FooterProps {
  onSectionChange: (section: string) => void;
}

export const Footer = ({ onSectionChange }: FooterProps) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleWhatsAppClick = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to access our WhatsApp community group.",
        variant: "destructive",
      });
      return;
    }
    window.open("https://chat.whatsapp.com/C3fp988FURQ1h58T9VtIF0", "_blank");
  };

  return (
    <footer className="bg-card border-t border-border py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start space-y-8 md:space-y-0">
          {/* Logo and Description */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Link to="/" className="text-2xl font-bold gradient-text">
              Party Panther
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
              Your ultimate guide to Jakarta's hottest parties, events, and promotions.
            </p>
            <img src="/logo-partypanyther.jpeg" alt="Party Panther Logo" className="mt-4 h-32" />
          </div>

          {/* Links */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <h3 className="font-semibold text-lg mb-2">Links</h3>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link>
            <Link to="/terms-conditions" className="text-muted-foreground hover:text-primary transition-colors">Terms and Conditions</Link>
            <button onClick={() => onSectionChange('blog')} className="text-muted-foreground hover:text-primary transition-colors">Blog</button>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Follow Us</h3>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => window.open("https://instagram.com/partypantherid", "_blank")}
                >
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={handleWhatsAppClick}
                >
                  <img src="/lovable-uploads/b887765b-39cc-4591-9a35-f4574776e28a.png" alt="WhatsApp" className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="flex flex-col items-center md:items-start space-y-2">
              <h3 className="font-semibold text-lg mb-2">Contact Us</h3>
              <p className="text-sm text-muted-foreground">Email: info@partypanther.id</p>
              <p className="text-sm text-muted-foreground">Phone: +62 812 3456 7890</p>
              <p className="text-sm text-muted-foreground">Instagram: @partypanther.id</p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-border" />

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Party Panther. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
