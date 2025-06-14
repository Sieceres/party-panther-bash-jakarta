import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Star, Calendar, Link as LinkIcon } from "lucide-react";

const mockUser = {
  name: "Alex Chen",
  username: "@alexparty",
  bio: "Jakarta party enthusiast | Event organizer | Always looking for the next great party! 🎉",
  profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  eventsAttended: 47,
  eventsCreated: 12,
  rating: 4.8,
  badges: ["Party Animal", "Event Creator", "Social Butterfly", "Night Owl"],
  socialLinks: {
    instagram: "@alexparty_jkt",
    twitter: "@alexparty",
    tiktok: "@alexparty"
  },
  recentActivity: [
    "Attended Electronic Night at Sky Bar",
    "Created Friday Night Fever",
    "Joined Rooftop Party Experience"
  ]
};

export const UserProfile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary neon-glow">
                <img
                  src={mockUser.profileImage}
                  alt={mockUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-primary-foreground fill-current" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-3xl font-bold gradient-text">{mockUser.name}</h2>
                <p className="text-lg text-muted-foreground">{mockUser.username}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  {mockUser.bio}
                </p>
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-pink">{mockUser.eventsAttended}</div>
                  <div className="text-xs text-muted-foreground">Events Attended</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-blue">{mockUser.eventsCreated}</div>
                  <div className="text-xs text-muted-foreground">Events Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-purple">{mockUser.rating}</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Edit Profile
                </Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Share Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span>Badges</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockUser.badges.map((badge) => (
                <Badge key={badge} className="bg-primary/20 text-primary border-primary/30">
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <span>Social Media</span>
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(mockUser.socialLinks).map(([platform, handle]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">{platform}</span>
                <span className="text-sm font-medium text-primary">{handle}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="font-semibold flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Recent Activity</span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUser.recentActivity.map((activity, index) => (
                <div key={index} className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                  {activity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};