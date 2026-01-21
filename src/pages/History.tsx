import { useState, useEffect } from "react";
import { Clock, Pill, Trash2, Search, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  pill_name: string;
  confidence: number;
  image_url: string | null;
  created_at: string;
  color: string;
  shape: string;
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("detection_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("detection_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Deleted",
        description: "Detection record removed from history",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const filteredHistory = history.filter((item) =>
    item.pill_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Detection <span className="gradient-text">History</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              View your past pill detection results
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by pill name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 rounded-xl"
            />
          </div>

          {/* History List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <CardContent className="py-6">
                    <div className="h-16 bg-muted rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-muted flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">
                  {searchQuery ? "No results found" : "No detection history"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Your pill detection results will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item, index) => (
                <Card
                  key={item.id}
                  className="glass-card hover:shadow-lg transition-shadow animate-fade-in"
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                        <Pill className="w-6 h-6 text-primary-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-lg truncate">
                          {item.pill_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.created_at)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {(item.confidence * 100).toFixed(0)}% confidence
                          </span>
                          {item.color && (
                            <span className="text-xs">{item.color} • {item.shape}</span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats */}
          {history.length > 0 && (
            <Card className="mt-8 glass-card">
              <CardContent className="py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-display font-bold gradient-text">
                      {history.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold gradient-text">
                      {new Set(history.map((h) => h.pill_name)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Unique Pills</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold gradient-text">
                      {(
                        (history.reduce((sum, h) => sum + h.confidence, 0) /
                          history.length) *
                        100
                      ).toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Confidence</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold gradient-text">
                      {history.filter(
                        (h) =>
                          new Date(h.created_at) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length}
                    </p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
