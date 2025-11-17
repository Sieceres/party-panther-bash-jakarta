import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstagramEmbedProps {
  url: string;
  className?: string;
}

export const InstagramEmbed = ({ url, className = '' }: InstagramEmbedProps) => {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmbed = async () => {
      try {
        setLoading(true);
        setError(null);

        // Normalize URL
        const normalizedUrl = url.endsWith('/') ? url : `${url}/`;

        // Call edge function
        const { data, error: functionError } = await supabase.functions.invoke('instagram-oembed', {
          body: { url: normalizedUrl }
        });

        if (functionError) {
          console.error('[InstagramEmbed] Edge function error:', functionError);
          setError('Failed to load Instagram embed');
          return;
        }

        if (data?.html) {
          setEmbedHtml(data.html);
        } else {
          setError('No embed HTML returned');
        }
      } catch (err) {
        console.error('[InstagramEmbed] Fetch error:', err);
        setError('Failed to load Instagram embed');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchEmbed();
    }
  }, [url]);

  useEffect(() => {
    // Load Instagram embed.js once for post-processing
    if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Process embeds when HTML changes
    if (embedHtml && (window as any).instgrm?.Embeds?.process) {
      (window as any).instgrm.Embeds.process();
    }
  }, [embedHtml]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="text-muted-foreground">Loading Instagram post...</div>
      </div>
    );
  }

  if (error || !embedHtml) {
    return (
      <div className={`flex justify-center ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          View this post on Instagram
        </a>
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-2 text-xs text-muted-foreground">
            Debug: {url}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`flex justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  );
};
