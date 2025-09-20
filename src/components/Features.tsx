import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  Scan, 
  Shield, 
  Languages, 
  FileSearch, 
  Workflow,
  BarChart3,
  Settings,
  Download,
  Eye,
  Zap,
  Lock
} from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Detection",
      description: "Advanced NLP and computer vision models detect PII in text, handwriting, barcodes, and images",
      badge: "Core Technology",
      color: "text-blue-600"
    },
    {
      icon: <Scan className="w-8 h-8" />,
      title: "Advanced OCR",
      description: "Extract text from scanned documents, photos, and handwritten content with 99%+ accuracy",
      badge: "OCR Engine",
      color: "text-green-600"
    },
    {
      icon: <Languages className="w-8 h-8" />,
      title: "Multilingual Support",
      description: "Process documents in 50+ languages with specialized models for each region",
      badge: "Global Ready",
      color: "text-purple-600"
    },
    {
      icon: <Workflow className="w-8 h-8" />,
      title: "Adaptive Redaction",
      description: "Choose from full redaction, pseudonymization, or purpose-based filtering modes",
      badge: "Flexible",
      color: "text-orange-600"
    },
    {
      icon: <FileSearch className="w-8 h-8" />,
      title: "Cross-Page Linking",
      description: "Track and link identities across multiple pages and documents automatically",
      badge: "Advanced",
      color: "text-red-600"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Risk Scoring",
      description: "Real-time privacy risk assessment with detailed audit logs and compliance reports",
      badge: "Analytics",
      color: "text-cyan-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Compliance Ready",
      description: "Built for HIPAA, GDPR, DPDP, and other privacy regulations out of the box",
      badge: "Certified",
      color: "text-emerald-600"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Bulk Processing",
      description: "CLI tools and API for processing thousands of documents efficiently",
      badge: "Enterprise",
      color: "text-yellow-600"
    }
  ];

  const capabilities = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Document Types",
      items: ["PDFs", "Scanned Images", "Photos", "Multi-page Documents", "Forms", "Handwritten Notes"]
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "PII Detection",
      items: ["Names & Addresses", "SSN & Tax IDs", "Phone Numbers", "Email Addresses", "Credit Cards", "Medical Records"]
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Output Formats",
      items: ["Redacted PDFs", "Audit Reports", "JSON Metadata", "Compliance Summaries", "Risk Assessments"]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Security Features",
      items: ["End-to-end Encryption", "Zero-trust Architecture", "Role-based Access", "Audit Trails", "Secure Storage"]
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Enterprise-Grade PII Protection
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive AI-powered platform designed for healthcare, legal, and government organizations 
              requiring the highest levels of data protection and regulatory compliance.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-3 rounded-xl bg-muted", feature.color)}>
                      {feature.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Capabilities Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((capability, index) => (
              <Card key={index} className="p-6 bg-background border shadow-card">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {capability.icon}
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {capability.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {capability.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};