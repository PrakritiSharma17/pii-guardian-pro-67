import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  riskScore?: number;
}

export const UploadZone = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Files uploaded",
      description: `${acceptedFiles.length} file(s) ready for processing`,
    });

    // Simulate processing
    newFiles.forEach((file, index) => {
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing' }
            : f
        ));
      }, index * 500);

      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'completed', riskScore: Math.floor(Math.random() * 100) }
            : f
        ));
      }, 3000 + index * 500);
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff']
    },
    maxFiles: 10
  });

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

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 50) return <Badge variant="warning">Medium Risk</Badge>;
    return <Badge variant="secondary">Low Risk</Badge>;
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Upload Documents for PII Analysis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Drag and drop your PDF documents, scanned images, or photos. Our AI will automatically detect and analyze any personally identifiable information.
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
                    {isDragActive ? "Drop files here" : "Upload your documents"}
                  </h3>
                  <p className="text-muted-foreground">
                    Supports PDF, JPG, PNG, TIFF files up to 50MB each
                  </p>
                </div>
                <Button variant="outline" className="mt-4">
                  Choose Files
                </Button>
              </div>
            </div>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Processing Queue</h3>
                  <Button variant="ghost" onClick={() => setFiles([])}>
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                          <Badge variant="outline" className="animate-pulse">Processing...</Badge>
                        )}
                        {file.status === 'completed' && file.riskScore !== undefined && (
                          <div className="flex items-center space-x-2">
                            {getRiskBadge(file.riskScore)}
                            <span className="text-sm text-muted-foreground">
                              {file.riskScore}% risk
                            </span>
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