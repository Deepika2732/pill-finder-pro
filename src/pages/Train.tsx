import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const shapes = ["Round", "Oval", "Oblong", "Capsule", "Diamond", "Heart", "Hexagon", "Octagon", "Pentagon", "Rectangle", "Square", "Triangle", "Other"];
const colours = ["White", "Off-White", "Yellow", "Orange", "Pink", "Red", "Purple", "Blue", "Green", "Brown", "Tan", "Gray", "Black", "Multi-colored"];
const drugClasses = ["Analgesic", "Antibiotic", "Antidepressant", "Antihistamine", "Anti-inflammatory", "Antiviral", "Blood Pressure", "Cholesterol", "Diabetes", "Gastrointestinal", "Muscle Relaxant", "Sleep Aid", "Vitamin/Supplement", "Other"];

export default function Train() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    generic_name: "",
    drug_class: "",
    colour: "",
    size: "",
    shape: "",
    dosage: "",
    uses: "",
    description: "",
    warnings: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.generic_name.trim()) {
      toast({
        title: "Error",
        description: "Generic name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('pill-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pill-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // Insert pill data
      const { error: insertError } = await supabase
        .from('pills')
        .insert({
          generic_name: formData.generic_name.trim(),
          drug_class: formData.drug_class || null,
          colour: formData.colour || null,
          size: formData.size || null,
          shape: formData.shape || null,
          dosage: formData.dosage || null,
          uses: formData.uses || null,
          description: formData.description || null,
          warnings: formData.warnings || null,
          image_url: imageUrl
        });

      if (insertError) {
        throw new Error(`Failed to save pill: ${insertError.message}`);
      }

      toast({
        title: "Success",
        description: "Pill added to database successfully!"
      });

      navigate("/detection");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add pill",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/detection")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Add New Pill</h1>
            <p className="text-muted-foreground">Enter pill details to train the database</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Image Upload Card */}
            <Card className="medical-card lg:row-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Pill Image</CardTitle>
                <CardDescription>Upload a clear photo of the pill</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20">
                      <img 
                        src={imagePreview} 
                        alt="Pill preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-primary/30 bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <span className="text-sm font-medium text-muted-foreground">Click to upload image</span>
                      <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basic Info Card */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="generic_name">Generic Name *</Label>
                  <Input
                    id="generic_name"
                    placeholder="e.g., Paracetamol, Ibuprofen"
                    value={formData.generic_name}
                    onChange={(e) => handleInputChange("generic_name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drug_class">Drug Class</Label>
                  <Select value={formData.drug_class} onValueChange={(v) => handleInputChange("drug_class", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select drug class" />
                    </SelectTrigger>
                    <SelectContent>
                      {drugClasses.map((dc) => (
                        <SelectItem key={dc} value={dc}>{dc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 500mg, 10mg"
                    value={formData.dosage}
                    onChange={(e) => handleInputChange("dosage", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Physical Characteristics Card */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="text-lg">Physical Characteristics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="colour">Colour</Label>
                    <Select value={formData.colour} onValueChange={(v) => handleInputChange("colour", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select colour" />
                      </SelectTrigger>
                      <SelectContent>
                        {colours.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shape">Shape</Label>
                    <Select value={formData.shape} onValueChange={(v) => handleInputChange("shape", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shape" />
                      </SelectTrigger>
                      <SelectContent>
                        {shapes.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size (mm)</Label>
                  <Input
                    id="size"
                    placeholder="e.g., 10mm, 5x12mm"
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card className="medical-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Detailed Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Visual details, imprints, manufacturer information..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uses">Uses</Label>
                  <Textarea
                    id="uses"
                    placeholder="What conditions does this medication treat?"
                    value={formData.uses}
                    onChange={(e) => handleInputChange("uses", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warnings">Warnings & Side Effects</Label>
                  <Textarea
                    id="warnings"
                    placeholder="Side effects, drug interactions, precautions..."
                    value={formData.warnings}
                    onChange={(e) => handleInputChange("warnings", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/detection")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gradient-bg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pill
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          © 2026 PillDetect. Professional pill identification database.
        </footer>
      </div>
    </div>
  );
}
