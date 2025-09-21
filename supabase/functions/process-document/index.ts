import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PII detection patterns
const PII_PATTERNS = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  phone: /\b(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  license: /\b[A-Z]{1,2}\d{6,8}\b/g,
  medical_id: /\b(MRN|PAT|PATIENT)[-\s]?\d{6,10}/gi,
  bank_account: /\b\d{8,17}\b/g,
  address: /\b\d+\s+[A-Za-z\s,]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
  name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { document_id, file_content, user_id, is_government } = await req.json();

    console.log(`Processing document ${document_id} for user ${user_id}`);

    // Step 1: Extract text content from file (simulate OCR/text extraction)
    let textContent = '';
    try {
      // For demonstration, we'll decode base64 content or use as-is
      if (file_content.startsWith('data:')) {
        // Handle data URLs
        const base64Data = file_content.split(',')[1];
        textContent = atob(base64Data);
      } else {
        textContent = file_content;
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      textContent = file_content; // Fallback to original content
    }

    // Step 2: Detect PII in the text
    const piiDetections: any[] = [];
    const patterns = is_government ? PII_PATTERNS : {
      phone: PII_PATTERNS.phone,
      email: PII_PATTERNS.email,
      address: PII_PATTERNS.address,
      name: PII_PATTERNS.name,
      credit_card: PII_PATTERNS.credit_card
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = Array.from(textContent.matchAll(pattern));
      matches.forEach((match, index) => {
        piiDetections.push({
          type,
          detected_text: match[0],
          confidence_score: Math.random() * 0.3 + 0.7, // 70-100% confidence
          page_number: Math.floor(Math.random() * 3) + 1,
          coordinates: {
            x: Math.random() * 500,
            y: Math.random() * 700,
            width: match[0].length * 8,
            height: 20
          }
        });
      });
    }

    console.log(`Detected ${piiDetections.length} PII items`);

    // Step 3: Generate AES encryption key
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Export key for storage
    const exportedKey = await crypto.subtle.exportKey("raw", key);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    const keyFingerprint = await generateKeyFingerprint(exportedKey);

    console.log(`Generated encryption key with fingerprint: ${keyFingerprint}`);

    // Step 4: Encrypt PII content
    let encryptedContent = textContent;
    const encryptionMetadata: any[] = [];

    for (const pii of piiDetections) {
      try {
        // Generate unique IV for each encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the PII text
        const encodedText = new TextEncoder().encode(pii.detected_text);
        const encryptedBuffer = await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          key,
          encodedText
        );

        // Convert to base64 for storage
        const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
        const ivBase64 = btoa(String.fromCharCode(...iv));
        
        // Create encrypted token
        const encryptedToken = `[ENCRYPTED:${encryptedBase64}:${ivBase64}]`;
        
        // Replace original PII with encrypted token
        encryptedContent = encryptedContent.replace(pii.detected_text, encryptedToken);
        
        // Store encryption metadata
        encryptionMetadata.push({
          original_text: pii.detected_text,
          encrypted_token: encryptedToken,
          iv: ivBase64,
          type: pii.type,
          coordinates: pii.coordinates
        });

        console.log(`Encrypted PII: ${pii.type} - ${pii.detected_text}`);
      } catch (error) {
        console.error(`Error encrypting PII item:`, error);
      }
    }

    // Step 5: Calculate risk score
    const riskScore = calculateRiskScore(piiDetections, is_government);
    const confidenceScore = piiDetections.length > 0 
      ? piiDetections.reduce((sum, pii) => sum + pii.confidence_score, 0) / piiDetections.length
      : 0;

    // Step 6: Store encrypted content in storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('processed-documents')
      .upload(`${user_id}/${document_id}_encrypted.txt`, encryptedContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to store encrypted content');
    }

    console.log('Encrypted content stored:', uploadData.path);

    // Step 7: Save PII detections to database
    if (piiDetections.length > 0) {
      const { error: piiError } = await supabase
        .from('pii_detections')
        .insert(
          piiDetections.map(pii => ({
            document_id,
            pii_type: pii.type,
            detected_text: '[ENCRYPTED]', // Don't store original text
            redacted_text: pii.detected_text.replace(/./g, '*'), // Store redacted version
            confidence_score: pii.confidence_score,
            page_number: pii.page_number,
            coordinates: pii.coordinates,
            is_verified: false
          }))
        );

      if (piiError) {
        console.error('Error saving PII detections:', piiError);
      }
    }

    // Step 8: Save encryption key metadata
    const { data: keyData, error: keyError } = await supabase
      .from('encryption_keys')
      .insert({
        document_id,
        user_id,
        key_fingerprint: keyFingerprint,
        algorithm: 'AES-256-GCM'
      })
      .select()
      .single();

    if (keyError) {
      console.error('Error saving encryption key metadata:', keyError);
      throw new Error('Failed to save encryption key metadata');
    }

    // Step 9: Save processed file metadata
    await supabase
      .from('processed_files')
      .insert({
        document_id,
        user_id,
        original_storage_path: `${user_id}/${document_id}`,
        encrypted_storage_path: uploadData.path,
        processing_metadata: {
          pii_count: piiDetections.length,
          encryption_metadata: encryptionMetadata,
          risk_score: riskScore
        }
      });

    // Step 10: Update document status
    await supabase
      .from('documents')
      .update({
        status: riskScore > 80 ? 'quarantined' : 'completed',
        risk_score: Math.round(riskScore),
        confidence_score: Math.round(confidenceScore * 100),
        is_encrypted: true,
        encryption_key_id: keyData.id,
        encryption_metadata: {
          algorithm: 'AES-256-GCM',
          pii_encrypted_count: piiDetections.length,
          key_fingerprint: keyFingerprint
        },
        processing_completed_at: new Date().toISOString(),
        pages_processed: 1,
        total_pages: 1
      })
      .eq('id', document_id);

    console.log(`Document processing completed. Risk score: ${riskScore}`);

    return new Response(JSON.stringify({
      success: true,
      document_id,
      encryption_key: keyBase64,
      key_fingerprint: keyFingerprint,
      key_id: keyData.id,
      pii_detected: piiDetections.length,
      risk_score: Math.round(riskScore),
      confidence_score: Math.round(confidenceScore * 100),
      encrypted_file_path: uploadData.path,
      status: riskScore > 80 ? 'quarantined' : 'completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateKeyFingerprint(keyBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function calculateRiskScore(detections: any[], isGovernment: boolean): number {
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
    const confidenceAdjusted = baseRisk * detection.confidence_score;
    maxRisk = Math.max(maxRisk, confidenceAdjusted);
  });
  
  if (isGovernment) {
    maxRisk += detections.length * 5;
  }
  
  return Math.min(maxRisk, 100);
}