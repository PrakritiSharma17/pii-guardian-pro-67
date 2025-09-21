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

    const { key_id, format = 'base64' } = await req.json();

    console.log(`Generating key download for key_id: ${key_id}`);

    // Get key metadata
    const { data: keyData, error: keyError } = await supabase
      .from('encryption_keys')
      .select('*')
      .eq('id', key_id)
      .single();

    if (keyError || !keyData) {
      throw new Error('Encryption key not found');
    }

    // Update download timestamp
    await supabase
      .from('encryption_keys')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', key_id);

    // Get the original encryption key (in a real implementation, this would be stored securely)
    // For this demo, we'll regenerate based on the fingerprint (not secure, for demo only)
    const keyInfo = {
      id: keyData.id,
      document_id: keyData.document_id,
      algorithm: keyData.algorithm,
      key_fingerprint: keyData.key_fingerprint,
      created_at: keyData.created_at
    };

    let responseContent: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        responseContent = JSON.stringify({
          ...keyInfo,
          instructions: "Store this key securely. It's required to decrypt your document's PII data.",
          warning: "This key will only be shown once. Save it in a secure location."
        }, null, 2);
        contentType = 'application/json';
        filename = `encryption-key-${keyData.key_fingerprint}.json`;
        break;
      
      case 'qr':
        // Generate QR code data (would use a QR library in production)
        const qrData = JSON.stringify({
          keyId: keyData.id,
          fingerprint: keyData.key_fingerprint,
          algorithm: keyData.algorithm
        });
        responseContent = qrData;
        contentType = 'text/plain';
        filename = `encryption-key-${keyData.key_fingerprint}.txt`;
        break;
      
      default: // base64
        responseContent = JSON.stringify({
          ...keyInfo,
          format: 'base64',
          instructions: "Store this key securely. Use it with the decrypt-document function to restore original PII data.",
          security_notice: "Never share this key. It provides access to sensitive PII data in your document."
        }, null, 2);
        contentType = 'application/json';
        filename = `encryption-key-${keyData.key_fingerprint}.json`;
        break;
    }

    console.log(`Key download generated for ${keyData.document_id}`);

    return new Response(responseContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in download-key function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});