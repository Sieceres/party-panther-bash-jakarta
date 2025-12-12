import { useState, useEffect } from "react";
import { FileText, Upload, RotateCcw, History, Languages, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const LANGUAGES = [
  { value: "norwegian", label: "Norwegian" },
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "german", label: "German" },
  { value: "french", label: "French" },
  { value: "swedish", label: "Swedish" },
  { value: "danish", label: "Danish" },
];

const DEFAULT_INSTRUCTIONS = "Se etter grammatiske feil, stavefeil og setningsoppbygging. Sørg for at tonen er profesjonell og naturlig.";

const Proofing = () => {
  const [documentText, setDocumentText] = useState("");
  const [language, setLanguage] = useState("norwegian");
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [suggestionDetail, setSuggestionDetail] = useState<"sentence" | "paragraph">("sentence");
  const [isProofreading, setIsProofreading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const { toast } = useToast();

  // Auto-save instructions to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("proofing-instructions");
    if (saved) setInstructions(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("proofing-instructions", instructions);
  }, [instructions]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [".docx", ".txt", ".md"];
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!validTypes.includes(extension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .docx, .txt, or .md file",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      setDocumentText(text);
      toast({
        title: "Document uploaded",
        description: `${file.name} has been loaded`,
      });
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Could not read the file contents",
        variant: "destructive",
      });
    }
  };

  const handleProofread = () => {
    if (!documentText.trim()) {
      toast({
        title: "No text to proofread",
        description: "Please paste text or upload a document first",
        variant: "destructive",
      });
      return;
    }

    setIsProofreading(true);
    // Store in history
    setHistory(prev => [documentText, ...prev.slice(0, 9)]);
    
    // Simulate proofreading (would integrate with AI API)
    setTimeout(() => {
      setIsProofreading(false);
      toast({
        title: "Proofreading complete",
        description: "Document has been analyzed",
      });
    }, 2000);
  };

  const handleReset = () => {
    setInstructions(DEFAULT_INSTRUCTIONS);
    toast({
      title: "Instructions reset",
      description: "Default instructions have been restored",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        activeSection="home" 
        onSectionChange={() => {}} 
      />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Proofreader</h1>
              <p className="text-muted-foreground text-sm">Multi-language document analysis & improvement</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            History
          </Button>
        </div>

        {/* Main Content */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
              {/* Left: Text Editor */}
              <div className="space-y-2">
                <Textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Paste text here or upload a document..."
                  className="min-h-[400px] resize-none font-mono text-sm bg-muted/30 border-border/50"
                />
                {!documentText && (
                  <p className="text-center text-muted-foreground text-sm py-8 absolute inset-0 flex items-center justify-center pointer-events-none">
                    Waiting for text input...
                  </p>
                )}
              </div>

              {/* Right: Controls */}
              <div className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Languages className="h-4 w-4 text-primary" />
                    Document Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Upload className="h-4 w-4 text-primary" />
                    Upload Document
                  </Label>
                  <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".docx,.txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">Upload Document</p>
                      <p className="text-xs text-muted-foreground">.docx, .txt, .md</p>
                    </label>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Instructions (Autosaved)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleReset}
                      className="h-auto py-1 px-2 text-xs gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                  </div>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="min-h-[100px] resize-none text-sm"
                  />
                </div>

                {/* Suggestion Detail */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Suggestion Detail</Label>
                  <ToggleGroup 
                    type="single" 
                    value={suggestionDetail} 
                    onValueChange={(v) => v && setSuggestionDetail(v as "sentence" | "paragraph")}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="sentence" className="gap-2">
                      <span className="text-xs font-mono">"abc"</span>
                      Sentence
                    </ToggleGroupItem>
                    <ToggleGroupItem value="paragraph" className="gap-2">
                      <FileCheck className="h-4 w-4" />
                      Paragraph
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Proofread Button */}
                <Button 
                  onClick={handleProofread} 
                  disabled={isProofreading}
                  className="w-full"
                  size="lg"
                >
                  {isProofreading ? "Proofreading..." : "Proofread Document"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer onSectionChange={() => {}} />
    </div>
  );
};

export default Proofing;
