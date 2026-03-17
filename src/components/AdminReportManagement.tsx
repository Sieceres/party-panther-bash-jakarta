import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SpinningPaws } from "@/components/ui/spinning-paws";

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  target_title: string | null;
  reason: string;
  description: string | null;
  status: string;
  reporter_id: string;
  created_at: string;
  updated_at: string;
}

export const AdminReportManagement = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== "all") {
        query = query.eq('target_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ title: "Error", description: "Failed to load reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      toast({ title: "Updated", description: `Report marked as ${newStatus}` });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({ title: "Error", description: "Failed to update report", variant: "destructive" });
    }
  };

  const viewTarget = (report: Report) => {
    switch (report.target_type) {
      case 'promo':
        navigate(`/promo/${report.target_id}`);
        break;
      case 'event':
        navigate(`/event/${report.target_id}`);
        break;
      case 'profile':
        navigate(`/profile/${report.target_id}`);
        break;
      default:
        toast({ title: "Info", description: "Cannot navigate to this content type" });
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'resolved': return 'default';
      case 'dismissed': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Report Management
        </CardTitle>
        <div className="flex gap-3 mt-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="promo">Promo</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="profile">Profile</SelectItem>
              <SelectItem value="comment">Comment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <SpinningPaws size="md" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No reports found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{report.target_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {report.target_title || report.target_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {report.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(report.status)} className="capitalize">
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => viewTarget(report)} title="View target">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {report.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(report.id, 'resolved')} title="Resolve" className="text-green-600 hover:text-green-700">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(report.id, 'dismissed')} title="Dismiss" className="text-muted-foreground">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
