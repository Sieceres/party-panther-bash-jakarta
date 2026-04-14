import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TelegramLinkSectionProps {
  userId?: string;
}

export const TelegramLinkSection = ({ userId }: TelegramLinkSectionProps) => {
  const { toast } = useToast();
  const [isLinked, setIsLinked] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId) return;
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data } = await supabase.functions.invoke('telegram-link', {
        body: { action: 'status' },
      });
      setIsLinked(data?.linked || false);
    } catch (err) {
      console.error('Failed to check telegram status:', err);
    } finally {
      setChecking(false);
    }
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-link', {
        body: { action: 'generate_code' },
      });
      if (error) throw error;
      setLinkCode(data.code);
    } catch (err) {
      console.error('Failed to generate code:', err);
      toast({
        title: "Error",
        description: "Failed to generate link code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unlinkTelegram = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('telegram-link', {
        body: { action: 'unlink' },
      });
      if (error) throw error;
      setIsLinked(false);
      setLinkCode(null);
      toast({
        title: "Telegram unlinked",
        description: "You won't receive Telegram notifications anymore.",
      });
    } catch (err) {
      console.error('Failed to unlink:', err);
      toast({
        title: "Error",
        description: "Failed to unlink Telegram.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <h4 className="font-medium text-sm">Telegram Notifications</h4>
        {isLinked && (
          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
            ✓ Linked
          </Badge>
        )}
      </div>

      {isLinked ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            You'll receive Telegram notifications when there's activity on your events and promos.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={unlinkTelegram}
            disabled={loading}
            className="text-destructive hover:text-destructive"
          >
            {loading ? "Unlinking..." : "Unlink Telegram"}
          </Button>
        </div>
      ) : linkCode ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Send this code to our Telegram bot to link your account:
          </p>
          <div className="flex items-center gap-3">
            <code className="bg-primary/10 text-primary font-mono text-2xl font-bold px-4 py-2 rounded-lg tracking-wider">
              {linkCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(linkCode);
                toast({ title: "Copied!", description: "Code copied to clipboard." });
              }}
            >
              Copy
            </Button>
          </div>
          <a
            href="https://t.me/PartyPantherBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0088cc] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#006699] transition-colors"
          >
            ✈️ Open Bot in Telegram
          </a>
          <p className="text-xs text-muted-foreground">
            Code expires in 10 minutes. Click the button above, then send the code to the bot.
          </p>
          <Button variant="ghost" size="sm" onClick={() => { setLinkCode(null); checkStatus(); }}>
            I've sent the code ↻
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Get notified on Telegram when someone joins your event, comments, or reviews your promos.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={generateCode}
            disabled={loading}
          >
            {loading ? "Generating..." : "🔗 Link Telegram"}
          </Button>
        </div>
      )}
    </div>
  );
};
