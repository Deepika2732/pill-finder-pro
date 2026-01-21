import { Shield, Brain, Lock, AlertTriangle, CheckCircle2, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const techFeatures = [
  {
    icon: Brain,
    title: "Advanced AI Model",
    description:
      "Powered by state-of-the-art machine learning models trained on extensive pharmaceutical databases.",
  },
  {
    icon: Shield,
    title: "High Accuracy",
    description:
      "Our models achieve high accuracy in identifying pills based on color, shape, size, and imprints.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description:
      "Your images are processed securely and are not stored after analysis. Your data stays private.",
  },
];

const useCases = [
  "Healthcare professionals verifying patient medications",
  "Caregivers ensuring correct medication administration",
  "Pharmacists double-checking prescriptions",
  "Patients identifying unknown pills",
  "Emergency responders in overdose situations",
];

export default function About() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              About <span className="gradient-text">PillDetect</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered pill identification technology designed to enhance medication safety
              and help prevent dangerous drug mix-ups.
            </p>
          </div>

          {/* Mission */}
          <Card className="glass-card mb-12">
            <CardContent className="py-8">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-3">Our Mission</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Medication errors are a significant public health concern, with thousands
                    of adverse events occurring each year due to drug mix-ups and
                    misidentification. PillDetect aims to reduce these incidents by providing
                    an accessible, accurate, and instant pill identification tool that anyone
                    can use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology */}
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold mb-6 text-center">
              How Our Technology Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {techFeatures.map((feature, index) => (
                <Card
                  key={feature.title}
                  className="glass-card animate-fade-in"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <CardContent className="py-6">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-display font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <Card className="glass-card mb-12">
            <CardContent className="py-8">
              <h2 className="text-2xl font-display font-bold mb-6">Who Can Benefit?</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {useCases.map((useCase, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 animate-slide-in-right"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{useCase}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-display font-semibold text-destructive mb-2">
                    Important Disclaimer
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    PillDetect is designed to assist with pill identification but should not
                    replace professional medical advice. Always consult with a healthcare
                    provider or pharmacist before taking any medication. In case of a medical
                    emergency, contact your local emergency services immediately. The
                    identification provided by this tool is for informational purposes only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 text-center text-muted-foreground">
            <p>© 2024 PillDetect. Built with AI for medication safety.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
