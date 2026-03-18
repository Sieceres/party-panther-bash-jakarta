import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/H0YrbCkjWYiJ1hJkWRaNTk";
const STORAGE_KEY = "pp_whatsapp_popup_dismissed";

export const WhatsAppGroupDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleJoin = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.open(WHATSAPP_GROUP_LINK, "_blank");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-card">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-green-400" />
          </div>
          <DialogTitle className="text-xl">Join the Party Panthers! 🐾</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Do you want to join our Party Panther WhatsApp Group?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleJoin}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-base min-h-[48px]"
          >
            🐾 ROAR Yes!
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full glass-control text-muted-foreground min-h-[44px]"
          >
            😺 Purr, I'm already there!
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-muted-foreground min-h-[44px]"
          >
            😴 ZZZzzzZZZ I'll join some other time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
