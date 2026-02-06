import { useState, useRef } from "react";
import { Camera, Upload, Loader2, AlertCircle, Pill, Info, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        });
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
        toast({
          title: "Analysis Complete",
          description: `Identified: ${data.result.name}`,
        });
      } else {
        throw new Error(data?.error || "Analysis failed");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze pill");
      toast({
        title: "Analysis Failed",
        description: "Please try again with a clearer image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500";
    if (confidence >= 0.5) return "text-yellow-500";
    return "text-red-500";
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
              Upload or capture a pill image for AI-powered identification
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Upload Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    selectedImage
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/30 hover:border-primary/50"
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
                      <img
                        src={selectedImage}
                        alt="Selected pill"
                        className="max-h-48 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-sm text-muted-foreground">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Click to upload or take photo
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={analyzePill}
                    disabled={!selectedImage || isAnalyzing}
                    className="flex-1 gradient-bg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Pill className="w-4 h-4 mr-2" />
                        Analyze Pill
                      </>
                    )}
                  </Button>
                  {selectedImage && (
                    <Button variant="outline" onClick={resetAnalysis}>
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    {/* Main Info */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h3 className="text-xl font-display font-bold">
                        {result.name}
                      </h3>
                      <p className="text-muted-foreground">
                        {result.genericName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm">Confidence:</span>
                        <span
                          className={`font-bold ${getConfidenceColor(
                            result.confidence
                          )}`}
                        >
                          {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-muted-foreground">Drug Class</p>
                        <p className="font-medium">{result.drugClass}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-muted-foreground">Brand</p>
                        <p className="font-medium">{result.brandName}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-muted-foreground">Color</p>
                        <p className="font-medium">{result.color}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-muted-foreground">Shape</p>
                        <p className="font-medium">{result.shape}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground text-sm mb-1">
                        Description
                      </p>
                      <p className="text-sm">{result.description}</p>
                    </div>

                    {/* Usage */}
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground text-sm mb-1">
                        Usage
                      </p>
                      <p className="text-sm">{result.usage}</p>
                    </div>

                    {/* Warnings */}
                    {result.warnings && result.warnings.length > 0 && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldAlert className="w-4 h-4 text-destructive" />
                          <p className="font-medium text-destructive">
                            Warnings
                          </p>
                        </div>
                        <ul className="text-sm space-y-1">
                          {result.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Upload an image to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
            <p>
              <strong>Disclaimer:</strong> This tool is for informational
              purposes only. Always consult a healthcare professional or
              pharmacist for accurate medication identification and advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
