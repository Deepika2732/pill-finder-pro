import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pill, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PillCard } from "@/components/pills/PillCard";
import { PillDetailModal } from "@/components/pills/PillDetailModal";

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

const shapes = ["All Shapes", "Round", "Oval", "Oblong", "Capsule", "Diamond", "Heart", "Hexagon", "Octagon", "Pentagon", "Rectangle", "Square", "Triangle", "Other"];
const colours = ["All Colours", "White", "Off-White", "Yellow", "Orange", "Pink", "Red", "Purple", "Blue", "Green", "Brown", "Tan", "Gray", "Black", "Multi-colored"];

export default function Detection() {
  const navigate = useNavigate();
  const [pills, setPills] = useState<PillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [shapeFilter, setShapeFilter] = useState("All Shapes");
  const [colourFilter, setColourFilter] = useState("All Colours");
  const [selectedPill, setSelectedPill] = useState<PillData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchPills();
  }, []);

  const fetchPills = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pills')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPills(data || []);
    } catch (error) {
      console.error('Error fetching pills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPills = pills.filter(pill => {
    const matchesSearch = pill.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pill.drug_class?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pill.dosage?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesShape = shapeFilter === "All Shapes" || pill.shape === shapeFilter;
    const matchesColour = colourFilter === "All Colours" || pill.colour === colourFilter;

    return matchesSearch && matchesShape && matchesColour;
  });

  const handlePillClick = (pill: PillData) => {
    setSelectedPill(pill);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Pill Database</h1>
            <p className="text-muted-foreground">Search and identify pills from your database</p>
          </div>
          <Button onClick={() => navigate("/train")} className="gradient-bg">
            <Plus className="mr-2 h-4 w-4" />
            Add New Pill
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="medical-card mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, class, or dosage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={shapeFilter} onValueChange={setShapeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shapes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={colourFilter} onValueChange={setColourFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colours.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pills Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPills.length === 0 ? (
          <div className="text-center py-20">
            <Pill className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {pills.length === 0 ? "No pills in database" : "No pills match your search"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {pills.length === 0 
                ? "Start by adding your first pill to the database" 
                : "Try adjusting your search or filters"}
            </p>
            {pills.length === 0 && (
              <Button onClick={() => navigate("/train")} className="gradient-bg">
                <Plus className="mr-2 h-4 w-4" />
                Add First Pill
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredPills.length} of {pills.length} pills
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPills.map((pill) => (
                <PillCard 
                  key={pill.id} 
                  pill={pill} 
                  onClick={() => handlePillClick(pill)} 
                />
              ))}
            </div>
          </>
        )}

        {/* Detail Modal */}
        <PillDetailModal 
          pill={selectedPill} 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
        />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          © 2026 PillDetect. Professional pill identification database.
        </footer>
      </div>
    </div>
  );
}