import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, QrCode, Upload, X } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";

export interface PaymentMethod {
  method: string;
  detail: string;
}

export const PAYMENT_METHOD_OPTIONS = [
  "Bank Transfer",
  "QRIS",
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "LinkAja",
  "Cash at the door",
  "PayPal",
  "Wise",
  "Other",
];

const placeholderFor = (method: string) => {
  switch (method) {
    case "Bank Transfer":
      return "BCA 1234567890 (Jane Doe)";
    case "QRIS":
      return "Scan the QR code below";
    case "Cash at the door":
      return "IDR 150.000, exact change appreciated";
    case "PayPal":
    case "Wise":
      return "jane@example.com";
    default:
      return "0812-3456-7890 (Jane Doe)";
  }
};

interface Props {
  methods: PaymentMethod[];
  qrUrl: string | null;
  notes: string;
  onMethodsChange: (methods: PaymentMethod[]) => void;
  onQrUrlChange: (url: string | null) => void;
}

export const PaymentMethodsEditor = ({ methods, qrUrl, onMethodsChange, onQrUrlChange }: Props) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const update = (index: number, patch: Partial<PaymentMethod>) => {
    onMethodsChange(methods.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const handleQrFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please pick an image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const res = await uploadToCloudinary(file, "payment-qr");
      onQrUrlChange(res.secure_url);
      toast({ title: "QR code uploaded" });
    } catch (e) {
      console.error(e);
      toast({ title: "Upload failed", description: "Could not upload the QR code.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Payment methods</Label>

      {methods.length === 0 && (
        <p className="text-sm text-muted-foreground">No methods added yet.</p>
      )}

      {methods.map((m, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={m.method} onValueChange={(v) => update(i, { method: v })}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={m.detail}
            onChange={(e) => update(i, { detail: e.target.value })}
            placeholder={placeholderFor(m.method)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMethodsChange(methods.filter((_, idx) => idx !== i))}
            aria-label="Remove payment method"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onMethodsChange([...methods, { method: "Bank Transfer", detail: "" }])}
      >
        <Plus className="w-4 h-4 mr-2" /> Add method
      </Button>

      <div className="space-y-2 pt-2">
        <Label className="flex items-center gap-2">
          <QrCode className="w-4 h-4" /> QR code (optional)
        </Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleQrFile(f);
            e.target.value = "";
          }}
        />
        {qrUrl ? (
          <div className="flex items-center gap-3">
            <img src={qrUrl} alt="Payment QR code" className="w-20 h-20 rounded border object-contain bg-background" />
            <Button type="button" variant="ghost" size="sm" onClick={() => onQrUrlChange(null)}>
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> {uploading ? "Uploading..." : "Upload QR code"}
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          Attendees see a QR icon they can tap to scan and pay.
        </p>
      </div>
    </div>
  );
};
