import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { document_id, encryption_key_base64, user_id } = await req.json();

    console.log(`Decrypting document ${document_id} for user ${user_id}`);

    // Verify user owns the document
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('*, processed_files(*)')
      .eq('id', document_id)
      .eq('user_id', user_id)
      .single();

    if (docError || !docData) {
      throw new Error('Document not found or access denied');
    }

    if (!docData.is_encrypted) {
      throw new Error('Document is not encrypted');
    }

    // Get the encrypted file content
    const processedFile = docData.processed_files[0];
    if (!processedFile) {
      throw new Error('Encrypted file not found');
    }

    const { data: fileData, error: fileError } = await supabase.storage
      .from('processed-documents')
      .download(processedFile.encrypted_storage_path);

    if (fileError) {
      throw new Error('Failed to download encrypted file');
    }

    const encryptedContent = await fileData.text();
    console.log('Retrieved encrypted content');

    // Import the provided key
    let cryptoKey: CryptoKey;
    try {
      const keyBuffer = Uint8Array.from(atob(encryption_key_base64), c => c.charCodeAt(0));
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["decrypt"]
      );
    } catch (error) {
      throw new Error('Invalid encryption key format');
    }

    // Extract and decrypt PII tokens
    let decryptedContent = encryptedContent;
    const encryptedTokenRegex = /\[ENCRYPTED:([^:]+):([^\]]+)\]/g;
    
    const decryptionResults: any[] = [];
    
    let match;
    while ((match = encryptedTokenRegex.exec(encryptedContent)) !== null) {
      try {
        const [fullMatch, encryptedBase64, ivBase64] = match;
        
        // Decode the encrypted data and IV
        const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
        
        // Decrypt the data
        const decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          cryptoKey,
          encryptedData
        );
        
        const decryptedText = new TextDecoder().decode(decryptedBuffer);
        
        // Replace encrypted token with original text
        decryptedContent = decryptedContent.replace(fullMatch, decryptedText);
        
        decryptionResults.push({
          encrypted_token: fullMatch,
          decrypted_text: decryptedText,
          success: true
        });
        
        console.log(`Successfully decrypted PII: ${decryptedText}`);
      } catch (error) {
        console.error('Error decrypting token:', error);
        decryptionResults.push({
          encrypted_token: match[0],
          error: 'Decryption failed',
          success: false
        });
      }
    }

    // Store decrypted file
    const decryptedFileName = `${user_id}/${document_id}_decrypted.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('processed-documents')
      .upload(decryptedFileName, decryptedContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('Error storing decrypted file:', uploadError);
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_action: 'decrypt_document',
      p_resource_type: 'documents',
      p_resource_id: document_id,
      p_details: {
        decrypted_tokens: decryptionResults.length,
        successful_decryptions: decryptionResults.filter(r => r.success).length
      }
    });

    console.log(`Document decryption completed. ${decryptionResults.filter(r => r.success).length}/${decryptionResults.length} tokens decrypted`);

    return new Response(JSON.stringify({
      success: true,
      document_id,
      decrypted_content: decryptedContent,
      decryption_results: decryptionResults,
      decrypted_file_path: uploadData?.path,
      total_tokens: decryptionResults.length,
      successful_decryptions: decryptionResults.filter(r => r.success).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in decrypt-document function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});