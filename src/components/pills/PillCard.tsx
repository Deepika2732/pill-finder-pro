import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill } from "lucide-react";

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

interface PillCardProps {
  pill: PillData;
  onClick: () => void;
}

export function PillCard({ pill, onClick }: PillCardProps) {
  return (
    <Card 
      className="medical-card cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group overflow-hidden"
      onClick={onClick}
    >
      <div className="aspect-square relative bg-muted/30 overflow-hidden">
        {pill.image_url ? (
          <img 
            src={pill.image_url} 
            alt={pill.generic_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Pill className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {pill.drug_class && (
          <Badge className="absolute top-2 right-2 bg-primary/90 hover:bg-primary">
            {pill.drug_class}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate mb-1 group-hover:text-primary transition-colors">
          {pill.generic_name}
        </h3>
        {pill.dosage && (
          <p className="text-sm text-muted-foreground mb-2">{pill.dosage}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {pill.colour && (
            <Badge variant="outline" className="text-xs">{pill.colour}</Badge>
          )}
          {pill.shape && (
            <Badge variant="outline" className="text-xs">{pill.shape}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
