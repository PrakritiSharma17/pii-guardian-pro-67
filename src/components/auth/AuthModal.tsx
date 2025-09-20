import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Building, Users, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<"public" | "government">("public");
  const [organization, setOrganization] = useState("");
  const [governmentAgency, setGovernmentAgency] = useState("");
  const [securityClearance, setSecurityClearance] = useState("");
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!email || !password || !displayName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (userType === "government" && !governmentAgency) {
      toast({
        title: "Government Agency Required",
        description: "Please specify your government agency",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            user_type: userType,
            organization: organization || null,
            government_agency: userType === "government" ? governmentAgency : null,
            security_clearance: userType === "government" ? securityClearance : null
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional information
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            user_type: userType,
            organization: organization || null,
            government_agency: userType === "government" ? governmentAgency : null,
            security_clearance: userType === "government" ? securityClearance : null
          })
          .eq("user_id", data.user.id);

        if (profileError) throw profileError;

        toast({
          title: "Account Created Successfully",
          description: userType === "government" 
            ? "Your government account has been created and is ready for secure PII analysis."
            : "Your account has been created. You now have free access to PII analysis.",
        });
        
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast({
        title: "Welcome Back",
        description: "You have successfully signed in to your secure PII analysis account.",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Secure Access Portal</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your.email@agency.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSignIn} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing In..." : "Sign In Securely"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your.email@agency.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Card 
                    className={`p-4 cursor-pointer transition-all ${userType === "public" ? "border-primary bg-primary/5" : "border-border"}`}
                    onClick={() => setUserType("public")}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Users className="w-6 h-6" />
                      <div>
                        <p className="font-medium">Public Access</p>
                        <Badge variant="secondary" className="text-xs">Free</Badge>
                      </div>
                    </div>
                  </Card>

                  <Card 
                    className={`p-4 cursor-pointer transition-all ${userType === "government" ? "border-primary bg-primary/5" : "border-border"}`}
                    onClick={() => setUserType("government")}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Building className="w-6 h-6" />
                      <div>
                        <p className="font-medium">Government</p>
                        <Badge variant="outline" className="text-xs">Enhanced Security</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {userType === "government" && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Government Account Details</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gov-agency">Government Agency *</Label>
                    <Input
                      id="gov-agency"
                      placeholder="Department of Defense, FBI, etc."
                      value={governmentAgency}
                      onChange={(e) => setGovernmentAgency(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="security-clearance">Security Clearance</Label>
                    <Select value={securityClearance} onValueChange={setSecurityClearance}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select clearance level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confidential">Confidential</SelectItem>
                        <SelectItem value="secret">Secret</SelectItem>
                        <SelectItem value="top-secret">Top Secret</SelectItem>
                        <SelectItem value="ts-sci">TS/SCI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input
                  id="organization"
                  placeholder="Your organization name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSignUp} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Creating Account..." : "Create Secure Account"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center space-x-2 mt-4">
            <Shield className="w-4 h-4" />
            <span>All data is encrypted and HIPAA/GDPR compliant</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};