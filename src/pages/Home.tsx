import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Eye, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroPills from "@/assets/hero-pills.jpg";

const features = [
  {
    icon: Eye,
    title: "AI-Powered Detection",
    description: "Advanced machine learning algorithms identify pills from images with high accuracy",
  },
  {
    icon: Zap,
    title: "Real-Time Results",
    description: "Get instant identification results with detailed pill information",
  },
  {
    icon: Shield,
    title: "Safety First",
    description: "Helps verify medications to prevent dangerous mix-ups",
  },
];

const benefits = [
  "Identify unknown pills quickly",
  "Verify prescription medications",
  "Access detailed drug information",
  "Track your detection history",
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-bg-subtle opacity-50" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              AI-Powered Pill Detection
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Identify Pills with{" "}
              <span className="gradient-text">Precision</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Upload or capture an image of any pill and get instant identification 
              using advanced AI technology. Safe, fast, and accurate.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button asChild size="lg" className="gradient-bg text-lg px-8 py-6 rounded-xl glow hover:opacity-90 transition-opacity">
                <Link to="/detection">
                  Start Detection
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl">
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI system makes pill identification simple and reliable
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Why Choose <span className="gradient-text">PillDetect</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a healthcare professional, caregiver, or patient, 
                our tool helps ensure medication safety and proper identification.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 animate-slide-in-right"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 gradient-bg rounded-3xl blur-3xl opacity-20" />
              <div className="relative glass-card rounded-3xl p-8 md:p-12">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-2xl gradient-bg flex items-center justify-center mb-6 animate-float">
                    <Eye className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">
                    Ready to Start?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Upload your first pill image and see the magic happen
                  </p>
                  <Button asChild className="gradient-bg w-full py-6 rounded-xl glow">
                    <Link to="/detection">
                      Try Now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 PillDetect. AI-powered pill identification for safety.</p>
        </div>
      </footer>
    </div>
  );
}
