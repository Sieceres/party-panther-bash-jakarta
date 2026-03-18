import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddVenueDialogProps {
  onVenueAdded?: () => void;
}

export function AddVenueDialog({ onVenueAdded }: AddVenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    instagram: "",
    website: "",
    whatsapp: "",
    google_maps_link: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Venue name is required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add a venue");
        return;
      }

      const { error } = await supabase.from("venues").insert({
        name: form.name.trim(),
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        instagram: form.instagram.trim() || null,
        website: form.website.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        google_maps_link: form.google_maps_link.trim() || null,
        created_by: user.id,
      });

      if (error) throw error;

      // Notify admin (fire-and-forget)
      supabase.functions.invoke('notify-admin', {
        body: {
          type: 'new_venue',
          title: form.name.trim(),
          details: { Address: form.address.trim() || 'N/A', Instagram: form.instagram.trim() || 'N/A' },
        }
      }).catch(err => console.error('Notify failed:', err));

      toast.success("Venue added successfully!");
      setForm({ name: "", address: "", description: "", instagram: "", website: "", whatsapp: "", google_maps_link: "" });
      setOpen(false);
      onVenueAdded?.();
    } catch (error: any) {
      console.error("Error adding venue:", error);
      toast.error(error.message || "Failed to add venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Venue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a New Venue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="venue-name">Name *</Label>
            <Input id="venue-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Dragonfly Jakarta" maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="venue-address">Address</Label>
            <Input id="venue-address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. Jl. Gatot Subroto, SCBD" maxLength={300} />
          </div>
          <div>
            <Label htmlFor="venue-desc">Description</Label>
            <Textarea id="venue-desc" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Brief description of the venue" maxLength={500} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="venue-ig">Instagram</Label>
              <Input id="venue-ig" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@handle" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="venue-wa">WhatsApp</Label>
              <Input id="venue-wa" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+62..." maxLength={20} />
            </div>
          </div>
          <div>
            <Label htmlFor="venue-web">Website</Label>
            <Input id="venue-web" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." maxLength={200} />
          </div>
          <div>
            <Label htmlFor="venue-maps">Google Maps Link</Label>
            <Input id="venue-maps" value={form.google_maps_link} onChange={(e) => update("google_maps_link", e.target.value)} placeholder="https://maps.google.com/..." maxLength={500} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Venue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
