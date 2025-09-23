import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Receipt, Eye, CheckCircle, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import defaultAvatar from "@/assets/default-avatar.png";

interface ReceiptData {
  id: string;
  event_id: string;
  user_id: string;
  receipt_url: string;
  receipt_uploaded_at: string;
  payment_status: boolean;
  event_title: string;
  event_date: string;
  user_name: string;
  user_avatar: string;
}

export const AdminReceiptManagement = () => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const { toast } = useToast();

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          id,
          event_id,
          user_id,
          receipt_url,
          receipt_uploaded_at,
          payment_status,
          events!inner(title, date),
          profiles!inner(display_name, avatar_url)
        `)
        .not('receipt_url', 'is', null)
        .order('receipt_uploaded_at', { ascending: false });

      if (error) throw error;

      const formattedReceipts = data?.map((item: any) => ({
        id: item.id,
        event_id: item.event_id,
        user_id: item.user_id,
        receipt_url: item.receipt_url,
        receipt_uploaded_at: item.receipt_uploaded_at,
        payment_status: item.payment_status,
        event_title: item.events.title,
        event_date: item.events.date,
        user_name: item.profiles.display_name || 'Anonymous',
        user_avatar: item.profiles.avatar_url
      })) || [];

      setReceipts(formattedReceipts);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast({
        title: "Error",
        description: "Failed to load receipts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReceipt = async (receiptId: string) => {
    try {
      const { error } = await supabase
        .from('event_attendees')
        .update({
          payment_status: true,
          payment_date: new Date().toISOString(),
          payment_marked_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', receiptId);

      if (error) throw error;

      setReceipts(prev => prev.map(receipt => 
        receipt.id === receiptId 
          ? { ...receipt, payment_status: true }
          : receipt
      ));

      toast({
        title: "Receipt approved",
        description: "Payment status has been updated to paid.",
      });
    } catch (error) {
      console.error('Error approving receipt:', error);
      toast({
        title: "Error",
        description: "Failed to approve receipt",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <SpinningPaws size="lg" />
            <p>Loading receipts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingReceipts = receipts.filter(r => !r.payment_status);
  const approvedReceipts = receipts.filter(r => r.payment_status);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Receipt Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingReceipts.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedReceipts.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              All ({receipts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingReceipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending receipts to review
              </p>
            ) : (
              pendingReceipts.map((receipt) => (
                <ReceiptCard 
                  key={receipt.id} 
                  receipt={receipt} 
                  onApprove={handleApproveReceipt}
                  onView={setSelectedReceipt}
                  showApproveButton={true}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedReceipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No approved receipts yet
              </p>
            ) : (
              approvedReceipts.map((receipt) => (
                <ReceiptCard 
                  key={receipt.id} 
                  receipt={receipt} 
                  onView={setSelectedReceipt}
                  showApproveButton={false}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {receipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No receipts uploaded yet
              </p>
            ) : (
              receipts.map((receipt) => (
                <ReceiptCard 
                  key={receipt.id} 
                  receipt={receipt} 
                  onApprove={handleApproveReceipt}
                  onView={setSelectedReceipt}
                  showApproveButton={!receipt.payment_status}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Receipt View Dialog */}
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedReceipt.user_avatar || defaultAvatar} />
                    <AvatarFallback>
                      {selectedReceipt.user_name[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedReceipt.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedReceipt.event_title} • {new Date(selectedReceipt.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={selectedReceipt.payment_status ? "default" : "secondary"}>
                    {selectedReceipt.payment_status ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <img 
                    src={getOptimizedImageUrl(selectedReceipt.receipt_url, { width: 800, quality: 90 })}
                    alt="Payment receipt" 
                    className="w-full h-auto rounded"
                  />
                </div>
                {!selectedReceipt.payment_status && (
                  <Button 
                    onClick={() => {
                      handleApproveReceipt(selectedReceipt.id);
                      setSelectedReceipt(null);
                    }}
                    className="w-full"
                  >
                    Approve Payment
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

interface ReceiptCardProps {
  receipt: ReceiptData;
  onApprove?: (receiptId: string) => void;
  onView: (receipt: ReceiptData) => void;
  showApproveButton: boolean;
}

const ReceiptCard = ({ receipt, onApprove, onView, showApproveButton }: ReceiptCardProps) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={receipt.user_avatar || defaultAvatar} />
          <AvatarFallback>
            {receipt.user_name[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{receipt.user_name}</p>
          <p className="text-sm text-muted-foreground">
            {receipt.event_title}
          </p>
          <p className="text-xs text-muted-foreground">
            Uploaded {new Date(receipt.receipt_uploaded_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={receipt.payment_status ? "default" : "secondary"}>
          {receipt.payment_status ? "Approved" : "Pending"}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(receipt)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        {showApproveButton && onApprove && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onApprove(receipt.id)}
            className="bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>
        )}
      </div>
    </div>
  );
};