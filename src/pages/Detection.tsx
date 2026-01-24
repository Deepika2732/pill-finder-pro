import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, AlertCircle, Info, Stethoscope, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import heroPills from "@/assets/hero-pills.jpg";

interface DetectionResult {
  name: string;
  genericName: string;
  brandName: string;
  drugClass: string;
  confidence: number;
  description: string;
  color: string;
  shape: string;
  imprint: string;
  usage: string;
  warnings: string[];
}

export default function Detection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isNonPill = result?.name === "Not a Pharmaceutical Pill";

  const displayValue = (value: string | null | undefined) => {
    const v = (value ?? "").trim();
    if (!v) return "Unconfirmed";
    if (/^(n\/?a|na|none)$/i.test(v)) return "Unconfirmed";
    return v;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setFileName(file.name);
      setResult(null);
      setError(null);
      setIsSubmitted(false);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setFileName("");
    setResult(null);
    setError(null);
    setIsSubmitted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = () => {
    if (!selectedImage) return;
    setIsSubmitted(true);
    setShowDialog(true);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-pill", {
        body: { image: selectedImage },
      });

      if (fnError) throw fnError;

      if (data.success && data.result) {
        setResult(data.result);
        toast({
          title: "Analysis Complete",
          description: `Identified: ${data.result.name}`,
        });
      } else {
        throw new Error(data.error || "Failed to analyze image");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze image";
      setError(message);
      toast({
        title: "Analysis Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[350px] flex items-center justify-start overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroPills}
            alt="Pills background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative z-10 ml-8 md:ml-16">
          <div className="relative p-6">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white" />
            
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white px-4 py-8">
              {result ? "Result" : "Upload Image"}
            </h1>
          </div>
        </div>
      </section>

      {/* Upload/Result Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-2">
                Detection and Identification of Pills
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                {result ? "Result" : "Upload Pills image"}
              </h2>
            </div>

            {/* Upload Area */}
            {!result && (
              <div className="space-y-6">
                {/* File Input */}
                <div className="flex items-center gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6"
                  >
                    Browse...
                  </Button>
                  <span className="text-muted-foreground">
                    {fileName || "No files selected."}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  {selectedImage && (
                    <Button variant="ghost" size="icon" onClick={clearImage}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Preview */}
                {selectedImage && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={selectedImage}
                        alt="Selected pill"
                        className="max-w-xs h-48 object-contain rounded-xl bg-muted border border-border"
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedImage || isSubmitted}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-12 py-6"
                  >
                    Submit
                  </Button>

                  <Button
                    onClick={analyzeImage}
                    disabled={!isSubmitted || isAnalyzing}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-6"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Recognize"
                    )}
                  </Button>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-center text-destructive">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Result Display */}
            {result && selectedImage && (
              <div className="space-y-6 animate-fade-in">
                {/* Main Result Card */}
                <Card className="overflow-hidden border-border shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Left: Pill Image */}
                      <div className="flex flex-col items-center">
                        <div className="w-52 h-52 rounded-2xl overflow-hidden bg-muted border border-border shadow-md">
                          <img
                            src={selectedImage}
                            alt="Detected pill"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-primary mt-4 text-center">{result.name}</h3>
                        <span className={`mt-2 px-4 py-1 rounded-full text-sm font-medium ${
                          result.confidence >= 0.8 
                            ? "bg-green-500/20 text-green-600" 
                            : result.confidence >= 0.5 
                              ? "bg-yellow-500/20 text-yellow-600" 
                              : "bg-primary/20 text-primary"
                        }`}>
                          {(result.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      </div>

                      {/* Right: Pill Details */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-6 h-6 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm"><span className="font-bold text-primary">Drug Class:</span> <span className="text-foreground">{isNonPill ? (result.drugClass || "N/A") : displayValue(result.drugClass)}</span></p>
                            <p className="text-sm"><span className="font-bold text-primary">Generic Name:</span> <span className="text-foreground">{isNonPill ? (result.genericName || "N/A") : displayValue(result.genericName)}</span></p>
                            <p className="text-sm"><span className="font-bold text-primary">Brand Name:</span> <span className="text-foreground">{isNonPill ? (result.brandName || "N/A") : displayValue(result.brandName)}</span></p>
                            <p className="text-sm"><span className="font-bold text-primary">Color:</span> <span className="text-foreground">{displayValue(result.color)}</span></p>
                            <p className="text-sm"><span className="font-bold text-primary">Shape:</span> <span className="text-foreground">{displayValue(result.shape)}</span></p>
                            <p className="text-sm"><span className="font-bold text-primary">Imprint:</span> <span className="text-foreground">{displayValue(result.imprint)}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Uses Card */}
                <Card className="border-border shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Uses</p>
                        <p className="text-foreground">{result.usage || "Cannot be determined without identification."}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description Card */}
                <Card className="border-border shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Description</p>
                        <p className="text-foreground">{result.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings Card */}
                {result.warnings && result.warnings.length > 0 && (
                  <Card className="border-destructive/30 shadow-md bg-destructive/5">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <p className="text-xs text-destructive uppercase tracking-wider font-semibold mb-2">Important Warnings</p>
                          <ul className="space-y-1">
                            {result.warnings.map((warning, i) => (
                              <li key={i} className="flex items-start gap-2 text-foreground">
                                <span className="text-destructive font-bold">•</span>
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* New Detection Button */}
                <div className="text-center pt-4">
                  <Button onClick={clearImage} variant="outline" className="px-8">
                    Detect Another Pill
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Image Submitted
            </AlertDialogTitle>
            <AlertDialogDescription>
              Click the Recognize button to predict the result
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-primary hover:bg-primary/90">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 PillDetect. AI-powered pill identification for safety.</p>
        </div>
      </footer>
    </div>
  );
}
