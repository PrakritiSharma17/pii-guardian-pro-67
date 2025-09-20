-- Create enum for user types
CREATE TYPE user_type AS ENUM ('government', 'public', 'admin');

-- Create enum for PII types  
CREATE TYPE pii_type AS ENUM ('ssn', 'credit_card', 'phone', 'email', 'address', 'name', 'date_of_birth', 'medical_id', 'passport', 'license', 'bank_account');

-- Create enum for processing status
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'quarantined');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL DEFAULT 'public',
  organization TEXT,
  government_agency TEXT,
  security_clearance TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for uploaded files
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status processing_status NOT NULL DEFAULT 'pending',
  risk_score INTEGER DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0.0,
  pages_processed INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 1,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PII detections table
CREATE TABLE public.pii_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  pii_type pii_type NOT NULL,
  detected_text TEXT NOT NULL,
  redacted_text TEXT,
  page_number INTEGER NOT NULL DEFAULT 1,
  coordinates JSONB, -- Store bounding box coordinates {x, y, width, height}
  confidence_score DECIMAL(5,2) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table for security tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis sessions table for tracking processing sessions
CREATE TABLE public.analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  document_count INTEGER DEFAULT 0,
  total_pii_detected INTEGER DEFAULT 0,
  high_risk_count INTEGER DEFAULT 0,
  medium_risk_count INTEGER DEFAULT 0,
  low_risk_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('document-uploads', 'document-uploads', false),
  ('processed-documents', 'processed-documents', false);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pii_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Government users can view all profiles for oversight
CREATE POLICY "Government users can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

-- Documents policies
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Government oversight policy for documents
CREATE POLICY "Government users can view documents for oversight" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

-- PII detections policies
CREATE POLICY "Users can view PII from their documents" ON public.pii_detections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = pii_detections.document_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update PII from their documents" ON public.pii_detections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = pii_detections.document_id AND user_id = auth.uid()
    )
  );

-- Government oversight for PII detections
CREATE POLICY "Government users can view all PII detections" ON public.pii_detections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Government and admin users can view all audit logs
CREATE POLICY "Government and admin users can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND user_type IN ('government', 'admin')
    )
  );

-- Analysis sessions policies
CREATE POLICY "Users can manage their own analysis sessions" ON public.analysis_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Storage policies for document uploads
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own uploaded documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'document-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own uploaded documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for processed documents
CREATE POLICY "Users can view their own processed documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'processed-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Government oversight for processed documents
CREATE POLICY "Government users can view processed documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'processed-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_risk_score ON public.documents(risk_score);
CREATE INDEX idx_pii_detections_document_id ON public.pii_detections(document_id);
CREATE INDEX idx_pii_detections_type ON public.pii_detections(pii_type);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_analysis_sessions_user_id ON public.analysis_sessions(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;