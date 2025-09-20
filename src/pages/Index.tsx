import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { EnhancedUploadZone } from "@/components/enhanced/EnhancedUploadZone";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <EnhancedUploadZone />
        <Features />
      </main>
    </div>
  );
};

export default Index;
