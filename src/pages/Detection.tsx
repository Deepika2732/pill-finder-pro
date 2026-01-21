import { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Loader2, Pill, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DetectionResult {
  name: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      setImageFile(file);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

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
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Pill <span className="gradient-text">Detection</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload or capture an image of a pill for instant AI-powered identification
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedImage ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      Drop image here or click to upload
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG, WEBP
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Selected pill"
                      className="w-full h-64 object-contain rounded-xl bg-muted"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full"
                      onClick={clearImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {selectedImage && (
                  <Button
                    className="w-full mt-4 gradient-bg py-6 rounded-xl glow"
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Pill className="w-5 h-5 mr-2" />
                        Analyze Pill
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Detection Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!result && !error && !isAnalyzing && (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <Pill className="w-8 h-8" />
                    </div>
                    <p>Upload an image to see results</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="h-64 flex flex-col items-center justify-center">
                    <div className="relative w-20 h-20 mb-4">
                      <div className="absolute inset-0 gradient-bg rounded-xl animate-pulse" />
                      <div className="absolute inset-2 bg-card rounded-lg flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    </div>
                    <p className="text-lg font-medium">Analyzing image...</p>
                    <p className="text-sm text-muted-foreground">AI is identifying the pill</p>
                  </div>
                )}

                {error && (
                  <div className="h-64 flex flex-col items-center justify-center text-destructive">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">Analysis Failed</p>
                    <p className="text-sm text-muted-foreground text-center mt-2">{error}</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-xl font-display font-bold">{result.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(result.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Color</p>
                        <p className="font-medium">{result.color}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Shape</p>
                        <p className="font-medium">{result.shape}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Imprint</p>
                        <p className="font-medium">{result.imprint || "None visible"}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                      <p className="text-sm">{result.description}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Common Usage</p>
                      <p className="text-sm">{result.usage}</p>
                    </div>

                    {result.warnings.length > 0 && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive uppercase tracking-wide mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Warnings
                        </p>
                        <ul className="text-sm space-y-1">
                          {result.warnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card className="mt-8 glass-card">
            <CardContent className="py-6">
              <h3 className="font-display font-semibold mb-4">Tips for Best Results</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Use good lighting and a plain background</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Capture any visible imprints or markings</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Take a clear, focused close-up image</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
