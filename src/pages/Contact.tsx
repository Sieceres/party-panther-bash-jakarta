import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/usePageTitle";

export const Contact = () => {
  usePageTitle("Contact");
  return (
    <div className="pt-20 px-4 min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-2xl bg-card border-border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">Contact Us</CardTitle>
          <p className="text-muted-foreground mt-2">
            Have a question or feedback? We'd love to hear from you!
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your Name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@example.com" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Subject of your message" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message..." rows={5} />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Send Message
            </Button>
          </form>
          <div className="text-center text-muted-foreground text-sm mt-6">
            <p>Or reach us directly at:</p>
            <p>Email: info@partypanther.com</p>
            <p>Phone: +62 812 3456 7890</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
