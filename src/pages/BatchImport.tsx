import { useState, useCallback, useEffect, useRef } from "react";
import { Clipboard, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, FileImage, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BatchImportReview, ExtractedPromo, ExtractedEvent, ExtractedContact, ExtractedVenue, DuplicateInfo } from "@/components/BatchImportReview";
import { detectDrinkCategory, getPlaceholderImage, enrichDrinkTypes } from "@/lib/drink-categories";
import { isSpreadsheetFile, parseSpreadsheetFile } from "@/lib/spreadsheet-parser";
import { normalizePromoType } from "@/lib/promo-types";

type ImportType = "promo" | "event" | "contact" | "venue";
type Step = "upload" | "review" | "done";
type ImportItem = ExtractedPromo | ExtractedEvent | ExtractedContact | ExtractedVenue;

const BatchImport = () => {
  const [activeSection, setActiveSection] = useState("import");
  const [step, setStep] = useState<Step>("upload");
  const [importType, setImportType] = useState<ImportType>("promo");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [insertedCount, setInsertedCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState("Uploading image...");
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getTypeLabel = (type: ImportType) => {
    switch (type) {
      case "promo": return "promos";
      case "event": return "events";
      case "contact": return "venue contacts";
      case "venue": return "venues";
    }
  };

  const processExtractedItems = useCallback(async (data: any, type: ImportType): Promise<ImportItem[]> => {
    const rawItems = data?.items || [];

    if (type === "venue") {
      return rawItems.map((item: any, idx: number) => ({
        id: `item-${idx}-${Date.now()}`,
        selected: true,
        name: item.name || "",
        address: item.address || "",
        area: item.area || "",
        description: item.description || "",
        instagram: (item.instagram || "").replace(/^@/, ""),
        whatsapp: item.whatsapp || "",
        website: item.website || "",
        google_maps_link: item.google_maps_link || "",
        opening_hours: item.opening_hours || "",
      } as ExtractedVenue));
    }

    if (type === "contact") {
      const { data: venues } = await supabase.from("venues").select("id, name");
      const venueList = venues || [];
      return rawItems.map((item: any, idx: number) => {
        const venueName = (item.venue_name || "").trim();
        const matched = venueList.find(v =>
          v.name.toLowerCase() === venueName.toLowerCase() ||
          v.name.toLowerCase().includes(venueName.toLowerCase()) ||
          venueName.toLowerCase().includes(v.name.toLowerCase())
        );
        return {
          id: `item-${idx}-${Date.now()}`,
          selected: true,
          venue_name: venueName,
          instagram: (item.instagram || "").replace(/^@/, ""),
          whatsapp: item.whatsapp || "",
          website: item.website || "",
          google_maps_link: item.google_maps_link || "",
          opening_hours: item.opening_hours || "",
          address: item.address || "",
          matched_venue_id: matched?.id || undefined,
          matched_venue_name: matched?.name || undefined,
        } as ExtractedContact;
      });
    }

    return rawItems.map((item: any, idx: number) => {
      const drinkTypes = item.drink_type || [];
      const title = item.title || "";
      const description = item.description || "";
      const discountText = item.discount_text || "";
      const drinkCategory = detectDrinkCategory(title, description, discountText, drinkTypes);
      const enrichedDrinkTypes = enrichDrinkTypes(drinkTypes, drinkCategory);
      const placeholderImage = getPlaceholderImage(drinkCategory);

      return {
        ...item,
        id: `item-${idx}-${Date.now()}`,
        selected: true,
        description,
        day_of_week: item.day_of_week || [],
        drink_type: enrichedDrinkTypes,
        venue_name: item.venue_name || "",
        venue_address: item.venue_address || "",
        area: item.area || "",
        promo_type: normalizePromoType(item.promo_type),
        category: item.category || "",
        discount_text: discountText,
        price_currency: item.price_currency || "IDR",
        original_price_amount: item.original_price_amount ?? null,
        discounted_price_amount: item.discounted_price_amount ?? null,
        date: item.date || "",
        time: item.time || "",
        organizer_name: item.organizer_name || "",
        image_url: placeholderImage,
        _drinkCategory: drinkCategory,
      };
    });
  }, []);

  // Fuzzy string similarity (Dice coefficient)
  const similarity = (a: string, b: string): number => {
    const sa = a.toLowerCase().replace(/[^a-z0-9]/g, "");
    const sb = b.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sa === sb) return 100;
    if (sa.length < 2 || sb.length < 2) return 0;
    const bigrams = (s: string) => {
      const set: Record<string, number> = {};
      for (let i = 0; i < s.length - 1; i++) {
        const bi = s.slice(i, i + 2);
        set[bi] = (set[bi] || 0) + 1;
      }
      return set;
    };
    const bg1 = bigrams(sa);
    const bg2 = bigrams(sb);
    let intersection = 0;
    for (const bi in bg1) {
      if (bg2[bi]) intersection += Math.min(bg1[bi], bg2[bi]);
    }
    return Math.round((2 * intersection) / (sa.length - 1 + sb.length - 1) * 100);
  };

  const checkBatchDuplicates = useCallback(async (extractedItems: ImportItem[], type: ImportType): Promise<ImportItem[]> => {
    if (type === "contact") return extractedItems; // contacts update existing, no duplicate concern

    try {
      let existingEntries: { id: string; name: string; slug?: string; venue?: string }[] = [];

      if (type === "venue") {
        const { data } = await supabase.from("venues").select("id, name, slug").limit(500);
        existingEntries = (data || []).map(v => ({ id: v.id, name: v.name, slug: v.slug || undefined }));
      } else if (type === "promo") {
        const { data } = await supabase.from("promos").select("id, title, venue_name, slug").limit(500);
        existingEntries = (data || []).map(p => ({ id: p.id, name: p.title, slug: p.slug || undefined, venue: p.venue_name }));
      } else if (type === "event") {
        const { data } = await supabase.from("events").select("id, title, venue_name, slug")
          .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .limit(500);
        existingEntries = (data || []).map(e => ({ id: e.id, name: e.title, slug: e.slug || undefined, venue: e.venue_name || undefined }));
      }

      if (existingEntries.length === 0) return extractedItems;

      return extractedItems.map(item => {
        const itemName = type === "venue" ? (item as ExtractedVenue).name : (item as ExtractedPromo | ExtractedEvent).title;
        const itemVenue = type === "venue" ? undefined : (item as ExtractedPromo).venue_name;

        let bestMatch: DuplicateInfo | undefined;
        let bestScore = 0;

        for (const existing of existingEntries) {
          let nameSim = similarity(itemName || "", existing.name);
          // Boost if venue also matches
          if (itemVenue && existing.venue) {
            const venueSim = similarity(itemVenue, existing.venue);
            if (venueSim >= 70) nameSim = Math.min(100, nameSim + 15);
          }
          if (nameSim >= 75 && nameSim > bestScore) {
            bestScore = nameSim;
            const reason = nameSim >= 95
              ? "Nearly identical name"
              : itemVenue && existing.venue && similarity(itemVenue, existing.venue) >= 70
                ? "Similar name at same venue"
                : "Similar name";
            bestMatch = {
              existingId: existing.id,
              existingName: existing.name,
              existingSlug: existing.slug,
              confidence: nameSim,
              reason,
            };
          }
        }

        if (bestMatch) {
          return { ...item, duplicateOf: bestMatch, selected: false } as ImportItem;
        }
        return item;
      });
    } catch (err) {
      console.error("Duplicate check failed:", err);
      return extractedItems; // proceed without duplicate info on error
    }
  }, []);

  const handleTextExtract = useCallback(async () => {
    if (!textInput.trim()) {
      toast({ title: "Please enter some text", variant: "destructive" });
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(0);
    setExtractionStatus("Sending text to AI...");

    const statuses = [
      { at: 15, text: "Analyzing text content..." },
      { at: 35, text: `Identifying ${getTypeLabel(importType)}...` },
      { at: 55, text: "Extracting details..." },
      { at: 75, text: "Parsing extracted data..." },
      { at: 90, text: "Almost done..." },
    ];
    let currentProgress = 0;
    progressInterval.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress > 95) currentProgress = 95;
      setExtractionProgress(Math.round(currentProgress));
      const status = [...statuses].reverse().find(s => currentProgress >= s.at);
      if (status) setExtractionStatus(status.text);
    }, 500);

    try {
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { text: textInput, type: importType },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Extraction failed", description: data.error, variant: "destructive" });
        setIsExtracting(false);
        return;
      }

      let extracted = await processExtractedItems(data, importType);

      setExtractionStatus("Checking for duplicates...");
      extracted = await checkBatchDuplicates(extracted, importType);
      const dupCount = extracted.filter((i: any) => i.duplicateOf).length;

      if (progressInterval.current) clearInterval(progressInterval.current);
      setExtractionProgress(100);
      setExtractionStatus(`Found ${extracted.length} ${getTypeLabel(importType)}!${dupCount ? ` (${dupCount} possible duplicates)` : ""}`);
      setItems(extracted);
      setTimeout(() => setStep("review"), 500);
      toast({ title: `Found ${extracted.length} ${getTypeLabel(importType)}`, description: "Review and edit before importing." });
    } catch (err) {
      console.error("Text extraction error:", err);
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to extract data", variant: "destructive" });
    } finally {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsExtracting(false);
    }
  }, [textInput, importType, toast, processExtractedItems]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (isSpreadsheetFile(file)) {
      setIsExtracting(true);
      setExtractionProgress(0);
      setExtractionStatus("Parsing spreadsheet...");
      setPreviewUrl(null);

      try {
        setExtractionProgress(30);
        setExtractionStatus("Reading columns...");
        // Spreadsheet parser doesn't support "venue" yet, treat as contact for now
        const parseType = importType === "venue" ? "contact" : importType;
        const parsed = await parseSpreadsheetFile(file, parseType as "promo" | "event" | "contact");
        setExtractionProgress(60);

        if (importType === "contact") {
          setExtractionStatus("Matching venues...");
          const { data: venues } = await supabase.from("venues").select("id, name");
          const venueList = venues || [];
          const enriched = (parsed as ExtractedContact[]).map((c) => {
            const matched = venueList.find(v =>
              v.name.toLowerCase() === c.venue_name.toLowerCase() ||
              v.name.toLowerCase().includes(c.venue_name.toLowerCase()) ||
              c.venue_name.toLowerCase().includes(v.name.toLowerCase())
            );
            return { ...c, matched_venue_id: matched?.id, matched_venue_name: matched?.name };
          });
          setExtractionProgress(90);
          setExtractionStatus("Checking for duplicates...");
          setExtractionProgress(100);
          setExtractionStatus(`Found ${enriched.length} contacts!`);
          setItems(enriched);
        } else if (importType === "venue") {
          const venueItems = (parsed as ExtractedContact[]).map((c) => ({
            id: c.id,
            selected: true,
            name: c.venue_name,
            address: c.address || "",
            area: "",
            description: "",
            instagram: c.instagram || "",
            whatsapp: c.whatsapp || "",
            website: c.website || "",
            google_maps_link: c.google_maps_link || "",
            opening_hours: c.opening_hours || "",
          } as ExtractedVenue));
          setExtractionStatus("Checking for duplicates...");
          const checked = await checkBatchDuplicates(venueItems, importType);
          const dupCount = checked.filter((i: any) => i.duplicateOf).length;
          setExtractionProgress(100);
          setExtractionStatus(`Found ${venueItems.length} venues!${dupCount ? ` (${dupCount} possible duplicates)` : ""}`);
          setItems(checked);
        } else {
          setExtractionStatus("Checking for duplicates...");
          const checked = await checkBatchDuplicates(parsed, importType);
          const dupCount = checked.filter((i: any) => i.duplicateOf).length;
          setExtractionProgress(100);
          setExtractionStatus(`Found ${parsed.length} ${getTypeLabel(importType)}!${dupCount ? ` (${dupCount} possible duplicates)` : ""}`);
          setItems(checked);
        }

        setTimeout(() => setStep("review"), 500);
        toast({ title: `Found ${parsed.length} ${getTypeLabel(importType)}`, description: "Review and edit before importing." });
      } catch (err) {
        console.error("Spreadsheet parse error:", err);
        toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to parse spreadsheet", variant: "destructive" });
      } finally {
        setIsExtracting(false);
      }
      return;
    }

    // Image/PDF flow
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsExtracting(true);
    setExtractionProgress(0);
    setExtractionStatus("Uploading image...");

    const statuses = [
      { at: 15, text: "Analyzing image content..." },
      { at: 35, text: `Identifying ${getTypeLabel(importType)}...` },
      { at: 55, text: "Extracting details..." },
      { at: 75, text: "Parsing extracted data..." },
      { at: 90, text: "Almost done..." },
    ];
    let currentProgress = 0;
    progressInterval.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress > 95) currentProgress = 95;
      setExtractionProgress(Math.round(currentProgress));
      const status = [...statuses].reverse().find(s => currentProgress >= s.at);
      if (status) setExtractionStatus(status.text);
    }, 500);

    try {
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
        toast({ title: "Extraction failed", description: data.error, variant: "destructive" });
        setIsExtracting(false);
        return;
      }

      let extracted = await processExtractedItems(data, importType);

      setExtractionStatus("Checking for duplicates...");
      extracted = await checkBatchDuplicates(extracted, importType);
      const dupCount = extracted.filter((i: any) => i.duplicateOf).length;

      if (progressInterval.current) clearInterval(progressInterval.current);
      setExtractionProgress(100);
      setExtractionStatus(`Found ${extracted.length} ${getTypeLabel(importType)}!${dupCount ? ` (${dupCount} possible duplicates)` : ""}`);
      setItems(extracted);
      setTimeout(() => setStep("review"), 500);
      toast({ title: `Found ${extracted.length} ${getTypeLabel(importType)}`, description: dupCount ? `${dupCount} possible duplicates auto-deselected.` : "Review and edit before importing." });
    } catch (err) {
      console.error("Extraction error:", err);
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to extract data", variant: "destructive" });
    } finally {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsExtracting(false);
    }
  }, [importType, toast, processExtractedItems]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (step !== "upload" || isExtracting) return;
      // Don't intercept paste if user is in text input mode and focused on textarea
      if (inputMode === "text") return;
      const clipItems = e.clipboardData?.items;
      if (!clipItems) return;
      for (const item of Array.from(clipItems)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFileUpload(file);
          return;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [step, isExtracting, handleFileUpload, inputMode]);

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

    if (importType === "venue") {
      const venues = selected as ExtractedVenue[];
      for (const v of venues) {
        if (!v.name.trim()) {
          errors.push("Venue with empty name skipped");
          continue;
        }
        const insertData: Record<string, any> = {
          name: v.name.trim(),
          created_by: user.id,
        };
        if (v.address) insertData.address = v.address;
        if (v.area) insertData.area = v.area;
        if (v.description) insertData.description = v.description;
        if (v.instagram) insertData.instagram = v.instagram;
        if (v.whatsapp) insertData.whatsapp = v.whatsapp;
        if (v.website) insertData.website = v.website;
        if (v.google_maps_link) insertData.google_maps_link = v.google_maps_link;
        if (v.opening_hours) insertData.opening_hours = v.opening_hours;

        const { error } = await supabase.from("venues").insert(insertData as any);
        if (error) {
          errors.push(`${v.name}: ${error.message}`);
        } else {
          successCount++;
        }
      }
    } else if (importType === "contact") {
      const contacts = selected as ExtractedContact[];
      for (const c of contacts) {
        if (!c.matched_venue_id) {
          errors.push(`${c.venue_name}: No matching venue found`);
          continue;
        }
        const updateData: Record<string, string | null> = {};
        if (c.instagram) updateData.instagram = c.instagram;
        if (c.whatsapp) updateData.whatsapp = c.whatsapp;
        if (c.website) updateData.website = c.website;
        if (c.google_maps_link) updateData.google_maps_link = c.google_maps_link;
        if (c.opening_hours) updateData.opening_hours = c.opening_hours;
        if (c.address) updateData.address = c.address;

        if (Object.keys(updateData).length === 0) {
          errors.push(`${c.venue_name}: No contact data to update`);
          continue;
        }

        const { error } = await supabase.from("venues").update(updateData).eq("id", c.matched_venue_id);
        if (error) {
          errors.push(`${c.venue_name}: ${error.message}`);
        } else {
          successCount++;
        }
      }
    } else if (importType === "promo") {
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
          image_url: (p as any).image_url || null,
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

    const typeLabel = getTypeLabel(importType);

    if (errors.length > 0) {
      toast({
        title: `${importType === "contact" ? "Updated" : "Imported"} ${successCount}, ${errors.length} failed`,
        description: errors[0],
        variant: "destructive",
      });
    } else {
      setStep("done");
      toast({
        title: `Successfully ${importType === "contact" ? "updated" : "imported"} ${successCount} ${typeLabel}!`,
      });
    }
  };

  const resetFlow = () => {
    setStep("upload");
    setItems([]);
    setPreviewUrl(null);
    setInsertedCount(0);
    setTextInput("");
  };

  const getViewRoute = () => {
    switch (importType) {
      case "venue": return "/venues";
      case "contact": return "/venues";
      case "promo": return "/promos";
      case "event": return "/events";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection="import" />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Batch Import
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload a flyer, spreadsheet, or paste text and AI will extract all items.
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
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Upload a file or paste text. The AI will extract all items automatically.
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
                    <SelectItem value="venue">Venues</SelectItem>
                    <SelectItem value="contact">Venue Contacts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "file" | "text")}>
                <TabsList className="w-full">
                  <TabsTrigger value="file" className="flex-1 gap-2">
                    <FileImage className="w-4 h-4" /> File Upload
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex-1 gap-2">
                    <Type className="w-4 h-4" /> Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-4">
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("batch-file-input")?.click()}
                  >
                    <input
                      id="batch-file-input"
                      type="file"
                      accept="image/*,.pdf,.csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    {isExtracting ? (
                      <div className="space-y-4 py-4">
                        <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                        <p className="text-lg font-medium">AI is extracting {getTypeLabel(importType)}...</p>
                        <Progress value={extractionProgress} className="max-w-xs mx-auto h-2" />
                        <p className="text-sm text-muted-foreground">{extractionStatus}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <FileImage className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-lg font-medium">Drop your image here or click to browse</p>
                        <p className="text-sm text-muted-foreground">Supports JPG, PNG, PDF, CSV, XLSX</p>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>You can also paste an image from your clipboard (Ctrl+V / ⌘V)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {previewUrl && !isExtracting && (
                    <div className="flex justify-center mt-4">
                      <img src={previewUrl} alt="Uploaded preview" className="max-h-48 rounded-lg border" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="mt-4 space-y-4">
                  {isExtracting ? (
                    <div className="space-y-4 py-8 text-center">
                      <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                      <p className="text-lg font-medium">AI is extracting {getTypeLabel(importType)}...</p>
                      <Progress value={extractionProgress} className="max-w-xs mx-auto h-2" />
                      <p className="text-sm text-muted-foreground">{extractionStatus}</p>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={`Paste your ${getTypeLabel(importType)} info here...\n\nExamples:\n- A list of venue names and addresses\n- Promo descriptions from a website\n- Event schedule text\n- Any unstructured text containing ${getTypeLabel(importType)} data`}
                        className="min-h-[200px]"
                      />
                      <Button
                        onClick={handleTextExtract}
                        disabled={!textInput.trim()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Extract {getTypeLabel(importType)} from text
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
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
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {importType === "contact" ? "Updating..." : "Importing..."}</>
                ) : (
                  <>{importType === "contact" ? "Update" : "Import"} {items.filter(i => i.selected).length} {getTypeLabel(importType)} <ArrowRight className="w-4 h-4 ml-2" /></>
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
              <h2 className="text-2xl font-bold">{importType === "contact" ? "Update" : "Import"} Complete!</h2>
              <p className="text-muted-foreground">
                Successfully {importType === "contact" ? "updated" : "imported"} {insertedCount} {getTypeLabel(importType)}.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={resetFlow}>
                  Import More
                </Button>
                <Button onClick={() => navigate(getViewRoute())}>
                  View {getTypeLabel(importType)}
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
