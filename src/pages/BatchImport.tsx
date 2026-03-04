import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileImage, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BatchImportReview, ExtractedPromo, ExtractedEvent } from "@/components/BatchImportReview";

type ImportType = "promo" | "event";
type Step = "upload" | "review" | "done";

const BatchImport = () => {
  const [activeSection, setActiveSection] = useState("import");
  const [step, setStep] = useState<Step>("upload");
  const [importType, setImportType] = useState<ImportType>("promo");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [items, setItems] = useState<(ExtractedPromo | ExtractedEvent)[]>([]);
  const [insertedCount, setInsertedCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = useCallback(async (file: File) => {
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsExtracting(true);

    try {
      // Convert to base64 data URL
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target?.result as string);
        r.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { image: base64, type: importType },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Extraction failed",
          description: data.error,
          variant: "destructive",
        });
        setIsExtracting(false);
        return;
      }

      const extracted = (data?.items || []).map((item: any, idx: number) => ({
        ...item,
        id: `item-${idx}-${Date.now()}`,
        selected: true,
        description: item.description || "",
        day_of_week: item.day_of_week || [],
        drink_type: item.drink_type || [],
        venue_name: item.venue_name || "",
        venue_address: item.venue_address || "",
        area: item.area || "",
        promo_type: item.promo_type || "",
        category: item.category || "",
        discount_text: item.discount_text || "",
        price_currency: item.price_currency || "IDR",
        original_price_amount: item.original_price_amount ?? null,
        discounted_price_amount: item.discounted_price_amount ?? null,
        date: item.date || "",
        time: item.time || "",
        organizer_name: item.organizer_name || "",
      }));

      setItems(extracted);
      setStep("review");

      toast({
        title: `Found ${extracted.length} ${importType === "promo" ? "promos" : "events"}`,
        description: "Review and edit before importing.",
      });
    } catch (err) {
      console.error("Extraction error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to extract data",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  }, [importType, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleBulkInsert = async () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      toast({ title: "No items selected", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "You must be logged in", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsInserting(true);
    let successCount = 0;
    const errors: string[] = [];

    if (importType === "promo") {
      const promos = selected as ExtractedPromo[];
      const validPromoTypes = ["Free Flow", "Ladies Night", "Bottle Promo", "Other"];
      const promoTypeMap: Record<string, string> = {
        happy_hour: "Free Flow",
        free_flow: "Free Flow",
        ladies_night: "Ladies Night",
        bottle_promo: "Bottle Promo",
        drink_special: "Other",
        food_special: "Other",
        brunch_deal: "Other",
        live_music: "Other",
        other: "Other",
      };
      const rows = promos.map(p => {
        const mappedType = promoTypeMap[p.promo_type] || (validPromoTypes.includes(p.promo_type) ? p.promo_type : null);
        return {
          title: p.title,
          description: p.description || p.discount_text,
          discount_text: p.discount_text,
          venue_name: p.venue_name,
          venue_address: p.venue_address || null,
          promo_type: mappedType,
          day_of_week: p.day_of_week.length > 0 ? p.day_of_week : null,
          area: p.area || null,
          drink_type: p.drink_type?.length > 0 ? p.drink_type : null,
          original_price_amount: p.original_price_amount,
          discounted_price_amount: p.discounted_price_amount,
          price_currency: p.price_currency || "IDR",
          category: p.category || null,
          created_by: user.id,
        };
      });

      const { data, error } = await supabase.from("promos").insert(rows).select("id");
      if (error) {
        errors.push(error.message);
      } else {
        successCount = data?.length || 0;
      }
    } else {
      const events = selected as ExtractedEvent[];
      for (const ev of events) {
        const { error } = await supabase.from("events").insert({
          title: ev.title,
          description: ev.description || null,
          date: ev.date || new Date().toISOString().split("T")[0],
          time: ev.time || "00:00",
          venue_name: ev.venue_name || null,
          venue_address: ev.venue_address || null,
          organizer_name: ev.organizer_name || null,
          price_currency: ev.price_currency || "IDR",
          created_by: user.id,
        });
        if (error) {
          errors.push(`${ev.title}: ${error.message}`);
        } else {
          successCount++;
        }
      }
    }

    setInsertedCount(successCount);
    setIsInserting(false);

    if (errors.length > 0) {
      toast({
        title: `Imported ${successCount}, ${errors.length} failed`,
        description: errors[0],
        variant: "destructive",
      });
    } else {
      setStep("done");
      toast({
        title: `Successfully imported ${successCount} ${importType === "promo" ? "promos" : "events"}!`,
      });
    }
  };

  const resetFlow = () => {
    setStep("upload");
    setItems([]);
    setPreviewUrl(null);
    setInsertedCount(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Batch Import
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload a flyer, schedule, or screenshot and AI will extract all promos or events.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Upload", "Review", "Done"].map((label, idx) => {
            const stepMap: Step[] = ["upload", "review", "done"];
            const isActive = step === stepMap[idx];
            const isDone = stepMap.indexOf(step) > idx;
            return (
              <div key={label} className="flex items-center gap-2">
                {idx > 0 && <div className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                  isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Image or Document</CardTitle>
              <CardDescription>
                Upload a flyer, weekly schedule, menu, or screenshot. The AI will extract all items.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">What are you importing?</label>
                <Select value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promo">Promos / Deals</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById("batch-file-input")?.click()}
              >
                <input
                  id="batch-file-input"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                {isExtracting ? (
                  <div className="space-y-4 py-4">
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <p className="text-lg font-medium">AI is extracting {importType === "promo" ? "promos" : "events"}...</p>
                    <Progress value={extractionProgress} className="max-w-xs mx-auto h-2" />
                    <p className="text-sm text-muted-foreground">{extractionStatus}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileImage className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-lg font-medium">Drop your image here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports JPG, PNG, PDF</p>
                  </div>
                )}
              </div>

              {previewUrl && !isExtracting && (
                <div className="flex justify-center">
                  <img src={previewUrl} alt="Uploaded preview" className="max-h-48 rounded-lg border" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={resetFlow}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Start over
              </Button>
              <Button
                onClick={handleBulkInsert}
                disabled={isInserting || items.filter(i => i.selected).length === 0}
              >
                {isInserting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                ) : (
                  <>Import {items.filter(i => i.selected).length} {importType === "promo" ? "promos" : "events"} <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>

            <BatchImportReview
              type={importType}
              items={items}
              onItemsChange={setItems}
            />
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Import Complete!</h2>
              <p className="text-muted-foreground">
                Successfully imported {insertedCount} {importType === "promo" ? "promos" : "events"}.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={resetFlow}>
                  Import More
                </Button>
                <Button onClick={() => navigate(importType === "promo" ? "/promos" : "/events")}>
                  View {importType === "promo" ? "Promos" : "Events"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer onSectionChange={setActiveSection} />
    </div>
  );
};

export default BatchImport;
