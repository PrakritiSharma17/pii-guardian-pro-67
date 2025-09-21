-- Add encryption-related columns to documents table
ALTER TABLE public.documents 
ADD COLUMN encryption_key_id TEXT,
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN encryption_metadata JSONB;

-- Create encryption_keys table to store key metadata (not the actual keys)
CREATE TABLE public.encryption_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  key_fingerprint TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  downloaded_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL
);

-- Enable RLS on encryption_keys
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for encryption_keys
CREATE POLICY "Users can view their own encryption keys" 
ON public.encryption_keys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create encryption keys for their documents" 
ON public.encryption_keys 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = encryption_keys.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Create processed_files table for storing encrypted file metadata
CREATE TABLE public.processed_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  original_storage_path TEXT NOT NULL,
  encrypted_storage_path TEXT NOT NULL,
  processing_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS on processed_files
ALTER TABLE public.processed_files ENABLE ROW LEVEL SECURITY;

-- Create policies for processed_files
CREATE POLICY "Users can view their own processed files" 
ON public.processed_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create processed files for their documents" 
ON public.processed_files 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = processed_files.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Add foreign key relationships
ALTER TABLE public.encryption_keys 
ADD CONSTRAINT fk_encryption_keys_document 
FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE public.processed_files 
ADD CONSTRAINT fk_processed_files_document 
FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;