import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { UploadZone } from "@/components/UploadZone";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <UploadZone />
        <Features />
      </main>
    </div>
  );
};

export default Index;
