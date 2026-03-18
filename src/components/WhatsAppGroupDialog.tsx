import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/H0YrbCkjWYiJ1hJkWRaNTk";
const STORAGE_KEY = "pp_whatsapp_popup_dismissed";

export const WhatsAppGroupDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
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

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="rounded-xl border border-primary/30 bg-card shadow-2xl p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Join the Party Panthers! 🐾</h3>
          <p className="text-sm text-muted-foreground">Do you want to join our Party Panther WhatsApp Group?</p>
        </div>
        <div className="flex flex-col gap-2 pt-3">
          <Button
            onClick={handleJoin}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm min-h-[42px]"
          >
            🐾 ROAR, yes!
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full text-muted-foreground text-sm min-h-[38px]"
          >
            😺 Purr, I'm already there!
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full text-muted-foreground text-sm min-h-[38px]">
            😴 Yawn, I'll join some other time
          </Button>
        </div>
      </div>
    </div>
  );
};
