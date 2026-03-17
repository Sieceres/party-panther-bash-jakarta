import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface UserFlag {
  id: string;
  user_id: string;
  flag_type: string;
  details: any;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

interface FlagWithProfile extends UserFlag {
  display_name?: string;
}

export const AdminUserFlags = ({ onFlagCountChange }: { onFlagCountChange?: (count: number) => void }) => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FlagWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('user_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch display names for flagged users
      const userIds = [...new Set((data || []).map(f => f.user_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        profileMap = Object.fromEntries(
          (profiles || []).map(p => [p.user_id, p.display_name || 'Unknown'])
        );
      }

      const flagsWithNames = (data || []).map(f => ({
        ...f,
        display_name: profileMap[f.user_id] || 'Unknown User',
      }));

      setFlags(flagsWithNames);
      const unresolvedCount = flagsWithNames.filter(f => !f.is_resolved).length;
      onFlagCountChange?.(unresolvedCount);
    } catch (error) {
      console.error('Error fetching flags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const resolveFlag = async (flagId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('user_flags')
        .update({ is_resolved: true, resolved_by: user?.id, resolved_at: new Date().toISOString() })
        .eq('id', flagId);

      if (error) throw error;
      toast({ title: "Flag resolved" });
      fetchFlags();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getFlagLabel = (type: string) => {
    switch (type) {
      case 'spam_reviews': return 'Spam Reviews';
      case 'spam_comments': return 'Spam Comments';
      case 'spam_reports': return 'Spam Reports';
      case 'rapid_activity': return 'Rapid Activity';
      default: return type;
    }
  };

  const getFlagColor = (type: string) => {
    switch (type) {
      case 'spam_reviews': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'spam_comments': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'spam_reports': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) return <div className="text-center py-4">Loading flags...</div>;

  const unresolvedFlags = flags.filter(f => !f.is_resolved);
  const resolvedFlags = flags.filter(f => f.is_resolved);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Suspicious Activity Flags
          {unresolvedFlags.length > 0 && (
            <Badge variant="destructive" className="ml-2">{unresolvedFlags.length} unresolved</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {flags.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No suspicious activity detected yet.</p>
        ) : (
          <div className="space-y-4">
            {unresolvedFlags.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Unresolved</h3>
                {unresolvedFlags.map(flag => (
                  <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg border-destructive/30 bg-destructive/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{flag.display_name}</span>
                        <Badge variant="outline" className={getFlagColor(flag.flag_type)}>
                          {getFlagLabel(flag.flag_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {flag.details?.trigger === 'rapid_reviews' && `${flag.details.count_last_hour} reviews in 1 hour`}
                        {flag.details?.trigger === 'high_negative_ratio' && `${Math.round(flag.details.negative_pct * 100)}% negative reviews`}
                        {flag.details?.trigger === 'rapid_reports' && `${flag.details.count_last_hour} reports in 1 hour`}
                        {flag.details?.trigger === 'rapid_comments' && `${flag.details.count_last_10min} comments in 10 min`}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(flag.created_at).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => resolveFlag(flag.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Resolve
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {resolvedFlags.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Resolved</h3>
                {resolvedFlags.slice(0, 10).map(flag => (
                  <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{flag.display_name}</span>
                        <Badge variant="outline">{getFlagLabel(flag.flag_type)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Flagged: {new Date(flag.created_at).toLocaleString()} · 
                        Resolved: {flag.resolved_at ? new Date(flag.resolved_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
