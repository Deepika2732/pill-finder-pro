import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pill, AlertTriangle, Info, Stethoscope, Ruler, Palette, Shapes } from "lucide-react";

interface PillData {
  id: string;
  generic_name: string;
  drug_class: string | null;
  colour: string | null;
  size: string | null;
  shape: string | null;
  dosage: string | null;
  uses: string | null;
  description: string | null;
  warnings: string | null;
  image_url: string | null;
  created_at: string;
}

interface PillDetailModalProps {
  pill: PillData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PillDetailModal({ pill, open, onOpenChange }: PillDetailModalProps) {
  if (!pill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text flex items-center gap-2">
            <Pill className="h-6 w-6" />
            {pill.generic_name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Image and Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 border border-border">
                {pill.image_url ? (
                  <img 
                    src={pill.image_url} 
                    alt={pill.generic_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Pill className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                {pill.drug_class && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Drug Class</p>
                    <Badge className="bg-primary">{pill.drug_class}</Badge>
                  </div>
                )}

                {pill.dosage && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dosage</p>
                    <p className="font-medium text-lg">{pill.dosage}</p>
                  </div>
                )}

                <Separator />

                {/* Physical Characteristics */}
                <div className="grid grid-cols-3 gap-3">
                  {pill.colour && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Palette className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Colour</p>
                      <p className="font-medium text-sm">{pill.colour}</p>
                    </div>
                  )}
                  {pill.shape && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Shapes className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Shape</p>
                      <p className="font-medium text-sm">{pill.shape}</p>
                    </div>
                  )}
                  {pill.size && (
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Ruler className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="font-medium text-sm">{pill.size}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {pill.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-5 w-5" />
                  <h4 className="font-semibold">Description</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {pill.description}
                </p>
              </div>
            )}

            {/* Uses */}
            {pill.uses && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Stethoscope className="h-5 w-5" />
                  <h4 className="font-semibold">Uses</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {pill.uses}
                </p>
              </div>
            )}

            {/* Warnings */}
            {pill.warnings && (
              <div className="space-y-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="font-semibold">Warnings & Side Effects</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {pill.warnings}
                </p>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground text-right pt-4 border-t border-border">
              Added on {new Date(pill.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
