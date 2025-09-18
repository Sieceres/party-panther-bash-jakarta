import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ExternalLink } from "lucide-react";
import { SpinningPaws } from "@/components/ui/spinning-paws";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  published_at: string;
  slug: string;
  feature_image?: string;
  primary_author: {
    name: string;
  };
}

export const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // This would be your Ghost blog URL and API key
        // For now, using placeholder data
        const placeholderPosts: BlogPost[] = [
          {
            id: "1",
            title: "Jakarta's Hottest Nightlife Spots This Month",
            excerpt: "Discover the most happening venues and events that are taking Jakarta's nightlife scene by storm...",
            published_at: "2024-01-15T10:00:00Z",
            slug: "jakarta-hottest-nightlife-spots",
            feature_image: "/placeholder-blog-1.jpg",
            primary_author: {
              name: "Party Panther Team"
            }
          },
          {
            id: "2",
            title: "How to Score the Best Party Deals in Jakarta",
            excerpt: "Learn insider tips and tricks to find exclusive discounts and promotions for Jakarta's best events...",
            published_at: "2024-01-10T15:30:00Z",
            slug: "best-party-deals-jakarta",
            feature_image: "/placeholder-blog-2.jpg",
            primary_author: {
              name: "Sarah Chen"
            }
          },
          {
            id: "3",
            title: "The Ultimate Guide to Jakarta's Rooftop Bars",
            excerpt: "From sky-high cocktails to breathtaking city views, explore Jakarta's most stunning rooftop venues...",
            published_at: "2024-01-05T12:00:00Z",
            slug: "ultimate-guide-rooftop-bars",
            feature_image: "/placeholder-blog-3.jpg",
            primary_author: {
              name: "Mike Rodriguez"
            }
          }
        ];
        
        setPosts(placeholderPosts);
        setLoading(false);
      } catch (err) {
        setError("Failed to load blog posts");
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-background via-background/50 to-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold gradient-text mb-4">Party Insights</h2>
            <div className="flex flex-col items-center space-y-4">
              <SpinningPaws size="lg" />
              <p className="text-xl text-muted-foreground">Loading latest articles...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-background via-background/50 to-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold gradient-text mb-4">Party Insights</h2>
            <p className="text-xl text-destructive">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4">Party Insights</h2>
          <p className="text-xl text-muted-foreground">
            Stay updated with the latest trends, tips, and stories from Jakarta's nightlife scene
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {post.feature_image && (
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={post.feature_image} 
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{post.primary_author.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    // In a real implementation, this would navigate to the Ghost blog
                    window.open(`https://your-ghost-blog.com/${post.slug}`, '_blank');
                  }}
                >
                  Read More
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => {
              // Navigate to full blog
              window.open('https://your-ghost-blog.com', '_blank');
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3"
          >
            View All Articles
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};