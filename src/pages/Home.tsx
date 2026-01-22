import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroPills from "@/assets/hero-pills.jpg";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-start overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroPills}
            alt="Pills background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Corner Bracket Text Overlay */}
        <div className="relative z-10 ml-8 md:ml-16">
          <div className="relative p-6">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white" />
            
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white px-4 py-8">
              Upload Image
            </h1>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Header */}
            <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-2">
              Detection and Identification of Pills
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">
              Upload Pills image
            </h2>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 items-center">
              <Button
                asChild
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-12 py-6 text-lg"
              >
                <Link to="/detection">
                  Start Detection
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 PillDetect. AI-powered pill identification for safety.</p>
        </div>
      </footer>
    </div>
  );
}
