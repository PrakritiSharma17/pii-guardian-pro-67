import { Button } from "@/components/ui/button";
import { Shield, FileCheck, Lock, Zap } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState } from "react";
import heroImage from "@/assets/hero-security.jpg";

export const Hero = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Content */}
          <div className="space-y-8">
             <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
               <Shield className="w-4 h-4 text-white" />
               <span className="text-white text-sm font-medium">AES-256-GCM Encryption Pipeline</span>
             </div>
            
            <div className="space-y-6">
               <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                 🔐 PII Encryption
                 <span className="bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent block">
                   Complete Flow
                 </span>
               </h1>
               
               <p className="text-xl text-blue-100 leading-relaxed max-w-lg">
                 End-to-end PII encryption pipeline with AES-256-GCM: Upload → Detect → Encrypt → Download Keys → Secure Storage. 
                 <strong>Free access with government-grade security features.</strong>
               </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
               <Button variant="hero" size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => setAuthModalOpen(true)}>
                 <Lock className="w-5 h-5 mr-2" />
                 Start Encrypting
               </Button>
               <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
                 <FileCheck className="w-5 h-5 mr-2" />
                 View Encryption Flow
               </Button>
            </div>
            
            {/* Trust indicators */}
             <div className="flex items-center space-x-6 pt-8">
               <div className="flex items-center space-x-2">
                 <Lock className="w-5 h-5 text-blue-200" />
                 <span className="text-blue-100 text-sm">AES-256-GCM</span>
               </div>
               <div className="flex items-center space-x-2">
                 <Shield className="w-5 h-5 text-blue-200" />
                 <span className="text-blue-100 text-sm">Zero-Knowledge Keys</span>
               </div>
               <div className="flex items-center space-x-2">
                 <FileCheck className="w-5 h-5 text-blue-200" />
                 <span className="text-blue-100 text-sm">Secure Downloads</span>
               </div>
             </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-glow">
              <img 
                src={heroImage} 
                alt="AI-powered document security platform"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          // Refresh will happen automatically via auth state change
        }}
      />
    </section>
  );
};