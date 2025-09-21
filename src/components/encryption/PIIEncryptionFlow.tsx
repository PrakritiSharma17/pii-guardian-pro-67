import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  Shield, 
  Key, 
  Download, 
  Lock, 
  Unlock, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  QrCode
} from "lucide-react";
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
  piiDetected?: number;
  processingProgress?: number;
  encryptionKey?: string;
  keyId?: string;
  keyFingerprint?: string;
  encryptedFilePath?: string;
  documentId?: string;
}

export const PIIEncryptionFlow = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [decryptionKey, setDecryptionKey] = useState("");
  const [decryptDocumentId, setDecryptDocumentId] = useState("");
  const [decryptedContent, setDecryptedContent] = useState("");
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
      title: "🔐 Starting PII Encryption Flow",
      description: `Processing ${acceptedFiles.length} file(s) with AES-256-GCM encryption`,
    });

    // Process each file through the backend
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const uploadedFile = newFiles[i];
      
      try {
        // Step 1: Upload file to storage
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'processing', processingProgress: 10 }
            : f
        ));

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('document-uploads')
          .upload(fileName, file);

        if (uploadError) throw new Error('Upload failed');

        // Step 2: Create document record
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, processingProgress: 25 }
            : f
        ));

        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            filename: fileName,
            original_filename: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: fileName,
            status: 'pending'
          })
          .select()
          .single();

        if (docError) throw new Error('Failed to create document record');

        // Step 3: Read file content for processing
        const fileContent = await file.text();
        
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, processingProgress: 50 }
            : f
        ));

        // Step 4: Process document with backend
        const { data: processResult, error: processError } = await supabase.functions
          .invoke('process-document', {
            body: {
              document_id: docData.id,
              file_content: fileContent,
              user_id: user.id,
              is_government: isGovernment
            }
          });

        if (processError) throw new Error(`Processing failed: ${processError.message}`);

        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                status: processResult.status,
                processingProgress: 100,
                riskScore: processResult.risk_score,
                confidenceScore: processResult.confidence_score,
                piiDetected: processResult.pii_detected,
                encryptionKey: processResult.encryption_key,
                keyId: processResult.key_id,
                keyFingerprint: processResult.key_fingerprint,
                encryptedFilePath: processResult.encrypted_file_path,
                documentId: docData.id
              }
            : f
        ));

        console.log(`Document ${file.name} processed successfully:`, processResult);

      } catch (error) {
        console.error(`Processing error for ${file.name}:`, error);
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'error', processingProgress: 100 }
            : f
        ));
        
        toast({
          title: "Processing Error",
          description: `Failed to process ${file.name}: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    setProcessing(false);
    toast({
      title: "🎉 Encryption Complete",
      description: "All files processed. Download your encryption keys securely!",
    });
  }, [user, toast, isGovernment]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.bmp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: isGovernment ? 50 : 10,
    maxSize: isGovernment ? 100 * 1024 * 1024 : 50 * 1024 * 1024
  });

  const downloadKey = async (file: UploadedFile, format: 'base64' | 'json' | 'qr' = 'json') => {
    if (!file.keyId) return;

    try {
      const { data, error } = await supabase.functions
        .invoke('download-key', {
          body: { key_id: file.keyId, format }
        });

      if (error) throw error;

      // Create download blob
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encryption-key-${file.keyFingerprint}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "🔑 Encryption Key Downloaded",
        description: "Store this key securely. It's required to decrypt your document.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const downloadEncryptedFile = async (file: UploadedFile) => {
    if (!file.encryptedFilePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('processed-documents')
        .download(file.encryptedFilePath);

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}_encrypted.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "📄 Encrypted File Downloaded",
        description: "Your document with encrypted PII is ready for safe storage.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const decryptDocument = async () => {
    if (!decryptDocumentId || !decryptionKey || !user) return;

    try {
      const { data, error } = await supabase.functions
        .invoke('decrypt-document', {
          body: {
            document_id: decryptDocumentId,
            encryption_key_base64: decryptionKey,
            user_id: user.id
          }
        });

      if (error) throw error;

      setDecryptedContent(data.decrypted_content);
      setActiveTab("decrypt");

      toast({
        title: "🔓 Decryption Successful",
        description: `${data.successful_decryptions}/${data.total_tokens} PII items decrypted`,
      });
    } catch (error) {
      toast({
        title: "Decryption Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Text copied successfully"
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRiskBadge = (score: number, status: string) => {
    if (status === 'quarantined') return <Badge variant="destructive">🚨 Quarantined</Badge>;
    if (score >= 80) return <Badge variant="destructive">🔴 High Risk</Badge>;
    if (score >= 50) return <Badge variant="secondary">🟡 Medium Risk</Badge>;
    if (score >= 20) return <Badge variant="outline">🟢 Low Risk</Badge>;
    return <Badge variant="outline">✅ Minimal Risk</Badge>;
  };

  if (!user) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Shield className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-3xl font-bold text-foreground">🔐 PII Encryption Platform</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sign in to access enterprise-grade PII encryption with AES-256-GCM. 
                Government users get enhanced security features.
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <h2 className="text-4xl font-bold text-foreground">🔐 PII Encryption Flow</h2>
              {isGovernment && (
                <Badge variant="outline" className="ml-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Government Access
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Complete AES-256-GCM encryption pipeline: Upload → Detect PII → Encrypt → Download Keys → Secure Storage
            </p>
          </div>

          {/* Flow Visualization */}
          <Card className="p-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Upload File</span>
              </div>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Identify PII</span>
              </div>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Encrypt PII</span>
              </div>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Export Key</span>
              </div>
              <div className="flex-1 h-px bg-border mx-2"></div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Download</span>
              </div>
            </div>
          </Card>

          {/* Main Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">🔐 Encrypt Documents</TabsTrigger>
              <TabsTrigger value="keys">🔑 Manage Keys</TabsTrigger>
              <TabsTrigger value="decrypt">🔓 Decrypt Documents</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
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
                        {isDragActive ? "Drop files here for encryption" : "Upload documents for PII encryption"}
                      </h3>
                      <p className="text-muted-foreground">
                        AES-256-GCM encryption • Supports PDF, JPG, PNG, DOCX, TXT up to {isGovernment ? '100MB' : '50MB'}
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

              {/* File Processing Results */}
              {files.length > 0 && (
                <div className="space-y-4">
                  {files.map((file) => (
                    <Card key={file.id} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {file.status === 'processing' && (
                              <Badge variant="outline" className="animate-pulse">Processing...</Badge>
                            )}
                            {file.status === 'completed' && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {getRiskBadge(file.riskScore || 0, file.status)}
                                <Badge variant="outline">
                                  🔒 {file.piiDetected} PII Encrypted
                                </Badge>
                              </div>
                            )}
                            {file.status === 'error' && (
                              <Badge variant="destructive">❌ Error</Badge>
                            )}
                          </div>
                        </div>

                        {file.status === 'processing' && (
                          <Progress value={file.processingProgress} className="w-full" />
                        )}

                        {file.status === 'completed' && (
                          <div className="space-y-4">
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">🔑 Encryption Key</h4>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Fingerprint: {file.keyFingerprint}
                                  </p>
                                  <div className="flex space-x-2">
                                    <Button size="sm" onClick={() => downloadKey(file, 'json')}>
                                      <Download className="w-3 h-3 mr-1" />
                                      Download Key
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(file.encryptionKey || '')}>
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">📄 Encrypted File</h4>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    PII Encrypted • Safe for Storage
                                  </p>
                                  <Button size="sm" onClick={() => downloadEncryptedFile(file)}>
                                    <Download className="w-3 h-3 mr-1" />
                                    Download File
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Keys Tab */}
            <TabsContent value="keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Encryption Key Management
                  </CardTitle>
                  <CardDescription>
                    Manage your encryption keys securely. Keys are never stored on our servers after download.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {files
                    .filter(f => f.status === 'completed' && f.encryptionKey)
                    .map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Fingerprint: {file.keyFingerprint} • {file.piiDetected} PII items
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => downloadKey(file, 'json')}>
                            <Download className="w-3 h-3 mr-1" />
                            JSON
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadKey(file, 'qr')}>
                            <QrCode className="w-3 h-3 mr-1" />
                            QR Code
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {files.filter(f => f.status === 'completed').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No encryption keys available. Upload and process documents first.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Decrypt Tab */}
            <TabsContent value="decrypt" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Unlock className="w-5 h-5 mr-2" />
                    Decrypt Documents
                  </CardTitle>
                  <CardDescription>
                    Use your encryption key to decrypt PII data from processed documents.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentId">Document ID</Label>
                      <Input
                        id="documentId"
                        placeholder="Enter document ID"
                        value={decryptDocumentId}
                        onChange={(e) => setDecryptDocumentId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="encryptionKey">Encryption Key (Base64)</Label>
                      <Input
                        id="encryptionKey"
                        type="password"
                        placeholder="Paste your encryption key"
                        value={decryptionKey}
                        onChange={(e) => setDecryptionKey(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={decryptDocument} disabled={!decryptDocumentId || !decryptionKey}>
                    <Unlock className="w-4 h-4 mr-2" />
                    Decrypt Document
                  </Button>

                  {decryptedContent && (
                    <div className="space-y-2">
                      <Label htmlFor="decryptedContent">Decrypted Content</Label>
                      <Textarea
                        id="decryptedContent"
                        value={decryptedContent}
                        readOnly
                        className="min-h-[200px] font-mono text-sm"
                      />
                      <Button variant="outline" onClick={() => copyToClipboard(decryptedContent)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Decrypted Content
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};