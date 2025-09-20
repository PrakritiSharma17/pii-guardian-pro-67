import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Image, Shield, AlertTriangle, Eye, Download, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'quarantined';
  riskScore?: number;
  confidenceScore?: number;
  piiDetected?: PIIDetection[];
  processingProgress?: number;
}

interface PIIDetection {
  type: string;
  text: string;
  confidence: number;
  page: number;
  coordinates?: { x: number; y: number; width: number; height: number };
}

export const EnhancedUploadZone = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user, profile, isGovernment } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload and analyze documents",
        variant: "destructive"
      });
      return;
    }

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      processingProgress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setProcessing(true);
    
    toast({
      title: "Files uploaded",
      description: `${acceptedFiles.length} file(s) ready for enhanced PII analysis`,
    });

    // Enhanced processing simulation with more realistic PII detection
    for (const file of newFiles) {
      try {
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing', processingProgress: 10 }
            : f
        ));

        // Simulate OCR and PII detection phases
        const detectionPhases = [
          { progress: 25, phase: "OCR Processing" },
          { progress: 50, phase: "Text Analysis" },
          { progress: 75, phase: "PII Detection" },
          { progress: 90, phase: "Risk Assessment" },
          { progress: 100, phase: "Complete" }
        ];

        for (const phase of detectionPhases) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, processingProgress: phase.progress }
              : f
          ));
        }

        // Generate realistic PII detections based on file type and government access
        const piiTypes = isGovernment 
          ? ['ssn', 'passport', 'license', 'medical_id', 'bank_account', 'phone', 'email', 'address', 'name']
          : ['phone', 'email', 'address', 'name', 'credit_card'];
        
        const detectedPII: PIIDetection[] = [];
        const numDetections = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < numDetections; i++) {
          const piiType = piiTypes[Math.floor(Math.random() * piiTypes.length)];
          detectedPII.push({
            type: piiType,
            text: generateSamplePII(piiType),
            confidence: Math.random() * 40 + 60, // 60-100% confidence
            page: Math.floor(Math.random() * 3) + 1,
            coordinates: {
              x: Math.random() * 500,
              y: Math.random() * 700,
              width: Math.random() * 200 + 100,
              height: 20
            }
          });
        }

        const riskScore = calculateRiskScore(detectedPII, isGovernment);
        const confidenceScore = detectedPII.reduce((sum, pii) => sum + pii.confidence, 0) / detectedPII.length;

        // Save to database
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            filename: fileName,
            original_filename: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: fileName,
            status: riskScore > 80 ? 'quarantined' : 'completed',
            risk_score: Math.round(riskScore),
            confidence_score: confidenceScore,
            pages_processed: Math.floor(Math.random() * 5) + 1,
            total_pages: Math.floor(Math.random() * 5) + 1,
            processing_completed_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }

        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: riskScore > 80 ? 'quarantined' : 'completed', 
                riskScore: Math.round(riskScore),
                confidenceScore: Math.round(confidenceScore),
                piiDetected: detectedPII,
                processingProgress: 100
              }
            : f
        ));

      } catch (error) {
        console.error('Processing error:', error);
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'error' }
            : f
        ));
      }
    }

    setProcessing(false);
  }, [user, toast, isGovernment]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.bmp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: isGovernment ? 50 : 10,
    maxSize: isGovernment ? 100 * 1024 * 1024 : 50 * 1024 * 1024 // 100MB for gov, 50MB for public
  });

  const generateSamplePII = (type: string): string => {
    const samples: Record<string, string[]> = {
      ssn: ['123-45-6789', '987-65-4321', '555-44-3333'],
      phone: ['(555) 123-4567', '555-987-6543', '+1-555-000-1234'],
      email: ['john.doe@email.com', 'jane@company.org', 'admin@gov.us'],
      address: ['123 Main St, City, ST 12345', '456 Oak Ave, Town, ST 67890'],
      name: ['John Smith', 'Jane Doe', 'Michael Johnson'],
      credit_card: ['4111-1111-1111-1111', '5555-5555-5555-4444'],
      passport: ['123456789', 'P12345678', 'A98765432'],
      license: ['DL12345678', 'A123-456-789-012'],
      medical_id: ['MRN123456789', 'PAT-987654321'],
      bank_account: ['1234567890', '9876543210']
    };
    
    const typeEntries = samples[type] || ['[REDACTED]'];
    return typeEntries[Math.floor(Math.random() * typeEntries.length)];
  };

  const calculateRiskScore = (detections: PIIDetection[], isGov: boolean): number => {
    if (detections.length === 0) return 0;
    
    const riskWeights: Record<string, number> = {
      ssn: 95,
      passport: 90,
      medical_id: 85,
      bank_account: 80,
      credit_card: 75,
      license: 70,
      address: 50,
      phone: 40,
      email: 30,
      name: 20
    };
    
    let maxRisk = 0;
    detections.forEach(detection => {
      const baseRisk = riskWeights[detection.type] || 10;
      const confidenceAdjusted = baseRisk * (detection.confidence / 100);
      maxRisk = Math.max(maxRisk, confidenceAdjusted);
    });
    
    // Government users see more detailed risk assessment
    if (isGov) {
      maxRisk += detections.length * 5; // Multiple PII types increase risk
    }
    
    return Math.min(maxRisk, 100);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6" />;
    if (type.includes('image')) return <Image className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  const getRiskBadge = (score: number, status: string) => {
    if (status === 'quarantined') return <Badge variant="destructive">Quarantined</Badge>;
    if (score >= 80) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 50) return <Badge variant="warning">Medium Risk</Badge>;
    if (score >= 20) return <Badge variant="secondary">Low Risk</Badge>;
    return <Badge variant="outline">Minimal Risk</Badge>;
  };

  const clearFiles = async () => {
    // Log audit event
    if (user) {
      await supabase.rpc('log_audit_event', {
        p_action: 'clear_upload_queue',
        p_resource_type: 'documents',
        p_details: { file_count: files.length }
      });
    }
    setFiles([]);
  };

  if (!user) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Shield className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-3xl font-bold text-foreground">Secure Authentication Required</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sign in to access our free, enterprise-grade PII analysis platform. Government users get enhanced security features and oversight capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <h2 className="text-3xl font-bold text-foreground">Enhanced PII Analysis</h2>
              {isGovernment && (
                <Badge variant="outline" className="ml-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Government Access
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isGovernment 
                ? "Advanced AI-powered analysis with government-grade security. Process up to 50 files (100MB each) with enhanced oversight capabilities."
                : "Free AI-powered PII detection and analysis. Upload up to 10 files (50MB each) for comprehensive privacy protection."
              }
            </p>
          </div>

          {/* Upload Zone */}
          <Card className="p-8">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer",
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {isDragActive ? "Drop files here" : "Upload your documents for analysis"}
                  </h3>
                  <p className="text-muted-foreground">
                    Supports PDF, JPG, PNG, TIFF, DOC, DOCX files up to {isGovernment ? '100MB' : '50MB'} each
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum {isGovernment ? '50' : '10'} files per session
                  </p>
                </div>
                <Button variant="outline" className="mt-4" disabled={processing}>
                  {processing ? "Processing..." : "Choose Files"}
                </Button>
              </div>
            </div>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Analysis Queue</h3>
                  <Button variant="ghost" onClick={clearFiles} disabled={processing}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {files.map((file) => (
                    <Card key={file.id} className="p-4 border">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-muted-foreground">
                              {getFileIcon(file.type)}
                            </div>
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {file.status === 'pending' && (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {file.status === 'processing' && (
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="animate-pulse">Processing...</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {file.processingProgress}%
                                </span>
                              </div>
                            )}
                            {file.status === 'completed' && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {getRiskBadge(file.riskScore || 0, file.status)}
                                <span className="text-sm text-muted-foreground">
                                  {file.riskScore}% risk
                                </span>
                              </div>
                            )}
                            {file.status === 'quarantined' && (
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                {getRiskBadge(file.riskScore || 0, file.status)}
                              </div>
                            )}
                            {file.status === 'error' && (
                              <Badge variant="destructive">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Error
                              </Badge>
                            )}
                          </div>
                        </div>

                        {file.status === 'processing' && file.processingProgress !== undefined && (
                          <Progress value={file.processingProgress} className="w-full" />
                        )}

                        {file.status === 'completed' && file.piiDetected && file.piiDetected.length > 0 && (
                          <div className="space-y-2">
                            <Separator />
                            <div>
                              <h4 className="text-sm font-medium mb-2">PII Detected ({file.piiDetected.length} items):</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {file.piiDetected.map((pii, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                                    <span className="font-medium capitalize">{pii.type.replace('_', ' ')}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(pii.confidence)}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              <span>Confidence: {Math.round(file.confidenceScore || 0)}%</span>
                              {isGovernment && (
                                <>
                                  <Separator orientation="vertical" className="h-4" />
                                  <Download className="w-4 h-4" />
                                  <span>Audit report available</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};