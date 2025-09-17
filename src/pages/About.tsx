import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, Calendar, Star } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header activeSection="" onSectionChange={() => {}} />
      <div className="pt-20 px-4">
        <div className="container mx-auto max-w-6xl py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold gradient-text mb-6">About Party Panther</h1>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-2xl font-bold gradient-text">PARTY PANTHER</span>
              <span className="text-sm font-serif text-red-500 transform -rotate-12 font-bold">BETA</span>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Jakarta's ultimate nightlife platform, letting you discover promos that make you purr, events that make you roar, and connect with other Party Panthers in the city.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="text-center">
              <CardContent className="p-6">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Events</h3>
                <p className="text-muted-foreground">Discover and join the most exciting parties and events happening in Jakarta</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Promotions</h3>
                <p className="text-muted-foreground">Access exclusive deals and promotions from top venues across the city</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Venues</h3>
                <p className="text-muted-foreground">Explore the best nightlife spots from rooftops to underground clubs</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-muted-foreground">Connect with like-minded party people and nightlife enthusiasts</p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            <section>
              <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
              <p className="text-lg text-muted-foreground text-center">
                At Party Panther, we want to take Jakarta's nightlife to the next level. Our mission is to create a comprehensive platform that shows party enthusiasts the best events the city has to offer, as well as providing you with an overview of the best promotions around so you can find the perfect place to have a drink tonight. Take Party Panther's paw and let us guide you.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-center">Why Choose Party Panther?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Curated Experiences</h3>
                  <p className="text-muted-foreground">
                    We handpick the best events and venues to ensure you have access to quality nightlife experiences that match your style and preferences.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Real-Time Updates</h3>
                  <p className="text-muted-foreground">
                    Stay informed with live updates on events, promotions, and venue information so you never miss out on the hottest parties in town.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Exclusive Deals</h3>
                  <p className="text-muted-foreground">
                    Access special promotions and discounts that are only available to Party Panther members, helping you save while you party.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
                  <p className="text-muted-foreground">
                    Join a community of nightlife enthusiasts who share reviews, recommendations, and experiences to help everyone discover the best spots.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              <p className="text-lg text-muted-foreground text-center">
                Founded in 2024, Party Panther emerged from a simple idea: Jakarta's nightlife scene needed a central hub where party people could discover, connect, and share their experiences. What started as a passion project by a group of nightlife enthusiasts has grown into Jakarta's go-to platform for nightlife discovery.
              </p>
              <p className="text-lg text-muted-foreground text-center mt-4">
                We're currently in beta, continuously improving our platform based on user feedback and the evolving needs of Jakarta's vibrant nightlife community. Join us on this exciting journey as we revolutionize how people experience Jakarta's nightlife!
              </p>
            </section>

            <section className="text-center">
              <h2 className="text-3xl font-bold mb-6">Join the Pack</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Ready to unleash your inner party animal? Join thousands of Jakarta nightlife enthusiasts who trust Party Panther to guide their night out.
              </p>
              <div className="bg-primary/10 p-8 rounded-lg">
                <p className="text-lg font-semibold mb-2">Questions or Feedback?</p>
                <p className="text-muted-foreground">
                  We'd love to hear from you! Reach out to us at{" "}
                  <a href="mailto:hello@partypanther.com" className="text-primary hover:underline">
                    hello@partypanther.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer onSectionChange={() => {}} />
    </div>
  );
};

export default About;
