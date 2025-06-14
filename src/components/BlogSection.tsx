import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ExternalLink, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  published_at: string;
  feature_image: string;
  tags: { name: string }[];
  authors: { name: string }[];
  reading_time: number;
}

export const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration - replace with actual Ghost API integration
  const mockPosts: BlogPost[] = [
    {
      id: "1",
      title: "Jakarta's Hottest New Venues Opening This Month",
      excerpt: "Discover the newest and most exciting party destinations that are about to transform Jakarta's nightlife scene...",
      slug: "jakarta-hottest-new-venues-opening",
      published_at: "2024-12-20T10:00:00Z",
      feature_image: "https://images.unsplash.com/photo-1556909114-4e1b89e1a72d?w=600&h=400&fit=crop",
      tags: [{ name: "venues" }, { name: "nightlife" }],
      authors: [{ name: "Party Panther Team" }],
      reading_time: 5
    },
    {
      id: "2", 
      title: "How to Score the Best Drink Deals in Jakarta",
      excerpt: "Our insider guide to finding the best happy hours, ladies nights, and exclusive drink promotions across the city...",
      slug: "best-drink-deals-jakarta-guide",
      published_at: "2024-12-18T14:30:00Z",
      feature_image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop",
      tags: [{ name: "deals" }, { name: "drinks" }],
      authors: [{ name: "Jakarta Insider" }],
      reading_time: 7
    },
    {
      id: "3",
      title: "Weekend Party Guide: December 2024",
      excerpt: "Your complete guide to the hottest weekend events happening this month, from rooftop parties to underground raves...",
      slug: "weekend-party-guide-december-2024",
      published_at: "2024-12-15T09:00:00Z", 
      feature_image: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&h=400&fit=crop",
      tags: [{ name: "events" }, { name: "weekend" }],
      authors: [{ name: "Event Curator" }],
      reading_time: 8
    },
    {
      id: "4",
      title: "The Ultimate Jakarta Nightlife Survival Guide",
      excerpt: "Everything you need to know about partying safely and stylishly in Jakarta, from dress codes to transportation tips...",
      slug: "jakarta-nightlife-survival-guide",
      published_at: "2024-12-12T16:00:00Z",
      feature_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop",
      tags: [{ name: "tips" }, { name: "safety" }],
      authors: [{ name: "Nightlife Expert" }],
      reading_time: 10
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation, you would call the Ghost API here
        // const response = await fetch(`${GHOST_API_URL}/ghost/api/v3/content/posts/?key=${GHOST_CONTENT_API_KEY}`);
        // const data = await response.json();
        // setPosts(data.posts);
        
        setPosts(mockPosts);
      } catch (err) {
        setError("Failed to load blog posts");
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Get unique tags for filter
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags.map(tag => tag.name))));

  // Filter posts based on search and tag
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === "all" || post.tags.some(tag => tag.name === selectedTag);
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-4xl font-bold gradient-text mb-2">Party Blog</h2>
          <p className="text-muted-foreground">Latest news, tips, and insights from Jakarta's nightlife scene</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border">
              <div className="animate-pulse">
                <div className="w-full h-48 bg-muted"></div>
                <CardContent className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-4xl font-bold gradient-text mb-2">Party Blog</h2>
          <p className="text-muted-foreground">Latest news, tips, and insights from Jakarta's nightlife scene</p>
        </div>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold gradient-text mb-2">Party Blog</h2>
        <p className="text-muted-foreground">Latest news, tips, and insights from Jakarta's nightlife scene</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="bg-card border-border hover:shadow-lg transition-shadow group">
            <div className="relative overflow-hidden">
              <img
                src={post.feature_image}
                alt={post.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-primary/90 text-primary-foreground">
                  {post.reading_time} min read
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag.name} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{post.authors[0]?.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    // In a real implementation, this would navigate to the full blog post
                    window.open(`/blog/${post.slug}`, '_blank');
                  }}
                >
                  Read More
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No blog posts found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Integration Note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">Ghost CMS Integration</h4>
              <p className="text-sm text-muted-foreground">
                This blog section is ready for Ghost CMS integration. To connect with your Ghost blog, you'll need to:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Set up a Ghost blog instance</li>
                <li>Generate a Content API key in Ghost Admin</li>
                <li>Configure the API endpoint in your environment</li>
                <li>Replace the mock data with actual Ghost API calls</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};