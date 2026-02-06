import { useState, useRef } from "react";
import { Camera, Upload, Loader2, AlertCircle, Pill, Info, ShieldAlert, FileText, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PillResult {
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PillResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image under 10MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePill = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-pill", {
        body: { image: selectedImage },
      });
      if (fnError) throw fnError;
      if (data?.success && data?.result) {
        setResult(data.result);
        toast({ title: "Analysis Complete", description: `Identified: ${data.result.name}` });
      } else {
        throw new Error(data?.error || "Analysis failed");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze pill");
      toast({ title: "Analysis Failed", description: "Please try again with a clearer image", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getConfidenceBadge = (confidence: number) => {
    const percent = (confidence * 100).toFixed(0);
    return (
      <span className="inline-block px-4 py-1 rounded-full border border-primary text-primary text-sm font-medium">
        {percent}% Confidence
      </span>
    );
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-2">
              Detection and Identification of Pills
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              {result ? "Result" : "Upload Pill Image"}
            </h1>
          </div>

          {/* Upload Section (shown when no result) */}
          {!result && (
            <Card className="max-w-2xl mx-auto glass-card">
              <CardContent className="p-8">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    selectedImage ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {selectedImage ? (
                    <div className="space-y-4">
                      <img src={selectedImage} alt="Selected pill" className="max-h-48 mx-auto rounded-lg shadow-md" />
                      <p className="text-sm text-muted-foreground">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Click to upload or take photo</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button onClick={analyzePill} disabled={!selectedImage || isAnalyzing} className="flex-1 gradient-bg">
                    {isAnalyzing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                    ) : (
                      <><Pill className="w-4 h-4 mr-2" />Analyze Pill</>
                    )}
                  </Button>
                  {selectedImage && (
                    <Button variant="outline" onClick={resetAnalysis}>Reset</Button>
                  )}
                </div>

                {error && (
                  <div className="mt-4 flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {result && (
            <div className="space-y-6">
              {/* Top row: Image + Details side by side */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Image card */}
                <Card className="glass-card">
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    {selectedImage && (
                      <img src={selectedImage} alt="Analyzed pill" className="max-h-56 rounded-lg shadow-md mb-4" />
                    )}
                    <h3 className="text-xl font-display font-bold text-primary text-center">
                      {result.name}
                    </h3>
                    <div className="mt-2">
                      {getConfidenceBadge(result.confidence)}
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Details card with cream background */}
                <Card className="border border-primary/20" style={{ backgroundColor: "hsl(40 60% 96%)" }}>
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <DetailRow label="Drug Class" value={result.drugClass} />
                    <DetailRow label="Generic Name" value={result.genericName} />
                    <DetailRow label="Brand Name" value={result.brandName} />
                    <DetailRow label="Color" value={result.color} />
                    <DetailRow label="Shape" value={result.shape} />
                    <DetailRow label="Imprint" value={result.imprint} />
                  </CardContent>
                </Card>
              </div>

              {/* Uses card */}
              <Card className="glass-card">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-foreground mb-1">Uses</h4>
                    <p className="text-muted-foreground">{result.usage}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Description card */}
              <Card className="glass-card">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-foreground mb-1">Description</h4>
                    <p className="text-muted-foreground">{result.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Warnings card */}
              {result.warnings && result.warnings.length > 0 && (
                <Card className="border border-destructive/20" style={{ backgroundColor: "hsl(0 60% 97%)" }}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm uppercase tracking-wider text-destructive mb-2">Important Warnings</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Back / Reset button */}
              <div className="text-center">
                <Button variant="outline" onClick={resetAnalysis} className="px-8">
                  Analyze Another Pill
                </Button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
            <p>
              <strong>Disclaimer:</strong> This tool is for informational purposes only. Always consult a healthcare professional or pharmacist for accurate medication identification and advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-bold text-primary whitespace-nowrap">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
