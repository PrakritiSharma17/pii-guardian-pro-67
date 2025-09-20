import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Menu, X, LogOut, User, Building } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, profile, signOut, isGovernment, loading } = useAuth();

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Security", href: "#security" },
    { name: "Documentation", href: "#docs" },
    { name: "Contact", href: "#contact" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PII Guardian Pro</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Data Protection</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-3">
                    {isGovernment && (
                      <Badge variant="outline" className="text-xs">
                        <Building className="w-3 h-3 mr-1" />
                        Government
                      </Badge>
                    )}
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{profile?.display_name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="hero" size="sm" onClick={() => setAuthModalOpen(true)}>
                    <Shield className="w-4 h-4 mr-1" />
                    Free Access
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="flex flex-col space-y-4">
                  {navItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                
                <div className="border-t pt-6 space-y-3">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{profile?.display_name}</p>
                          {isGovernment && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <Building className="w-3 h-3 mr-1" />
                              Government Access
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button variant="hero" className="w-full" onClick={() => setAuthModalOpen(true)}>
                      <Shield className="w-4 h-4 mr-2" />
                      Get Free Access
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          // Refresh will happen automatically via auth state change
        }}
      />
    </nav>
  );
};