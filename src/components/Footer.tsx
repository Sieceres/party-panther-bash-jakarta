import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter } from "lucide-react";

interface FooterProps {
  onSectionChange: (section: string) => void;
}

export const Footer = ({ onSectionChange }: FooterProps) => {
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

          {/* Navigation Links */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <h3 className="font-semibold text-lg mb-2">Quick Links</h3>
            <button onClick={() => onSectionChange('home')} className="text-muted-foreground hover:text-primary transition-colors">Home</button>
            <button onClick={() => onSectionChange('events')} className="text-muted-foreground hover:text-primary transition-colors">Events</button>
            <button onClick={() => onSectionChange('promos')} className="text-muted-foreground hover:text-primary transition-colors">Promos</button>
            <button onClick={() => onSectionChange('blog')} className="text-muted-foreground hover:text-primary transition-colors">Blog</button>
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            <button onClick={() => onSectionChange('profile')} className="text-muted-foreground hover:text-primary transition-colors">Profile</button>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <h3 className="font-semibold text-lg mb-2">Follow Us</h3>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Contact Info Placeholder */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <h3 className="font-semibold text-lg mb-2">Contact Us</h3>
            <p className="text-sm text-muted-foreground">Instagram: @partypanther.id</p>
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
