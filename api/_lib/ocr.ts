// OpenAI OCR Helper for Document Extraction
// Supports both POD and Invoice documents

import OpenAI from 'openai';
import type { PodOcrResult, InvoiceOcrResult } from '../../src/types/domain';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validate and normalize MIME type for images
function normalizeImageMimeType(mimeType: string): string {
  const validImageTypes: Record<string, string> = {
    'image/png': 'image/png',
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/gif': 'image/gif',
    'image/webp': 'image/webp',
  };
  
  const normalized = mimeType.toLowerCase().trim();
  return validImageTypes[normalized] || 'image/png'; // Default to PNG
}

// ============================================================================
// POD DOCUMENT OCR
// ============================================================================

/**
 * Extract metadata from POD (Proof of Delivery) document
 * @param fileBuffer - The file buffer (image or PDF)
 * @param fileType - MIME type of the file
 * @returns Extracted POD metadata with confidence score
 */
export async function extractPodMetadata(
  fileBuffer: Buffer,
  fileType: string
): Promise<PodOcrResult> {
  try {
    // POD prompt - LR Number is critical
    const ocrPrompt = `You are extracting data from a POD (Proof of Delivery) document.

CRITICAL REQUIREMENT: Extract the LR Number (also called Journey Number, Trip ID, LR No, LR Number).
This is the MOST IMPORTANT field. Look for it in headers, tables, or anywhere in the document.
Common formats: LR20257713, LR-20257713, LR 20257713, or just the number 20257713.

Extract ALL fields you can find:
1. LR Number / Journey Number / Trip ID / LR No (MANDATORY - search everywhere)
2. Vehicle number / Registration number
3. Load ID / LCU number
4. Charges (if any)
5. Total amount (if any)

Read only what is printed. Do not invent values. If LR Number is not visible, return null.

Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{
  "journeyNumber": "extracted LR number or null",
  "vehicleNumber": "string or null",
  "loadId": "string or null",
  "charges": [{"type": "string", "amount": number}],
  "totalAmount": number or null,
  "confidence": 0.8
}`;

    // Detect file type from buffer content (more reliable than MIME type)
    let rawMimeType = fileType || 'image/png';
    
    // Check buffer magic bytes to determine actual file type
    const bufferStart = fileBuffer.slice(0, 12);
    const hexStart = bufferStart.toString('hex');
    const textStart = bufferStart.toString('ascii');
    
    // Detect by magic bytes (most reliable - ignores wrong file extensions)
    if (textStart.startsWith('%PDF')) {
      rawMimeType = 'application/pdf';
    } else if (hexStart.startsWith('ffd8')) {
      // JPEG: FF D8 FF
      rawMimeType = 'image/jpeg';
    } else if (hexStart.startsWith('89504e470d0a1a0a')) {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      rawMimeType = 'image/png';
    } else if (hexStart.startsWith('474946')) {
      // GIF: 47 49 46 38 (GIF8)
      rawMimeType = 'image/gif';
    } else if (hexStart.startsWith('52494646') && bufferStart.slice(8, 12).toString('ascii') === 'WEBP') {
      // WebP: RIFF....WEBP
      rawMimeType = 'image/webp';
    }
    
    const isPdf = rawMimeType === 'application/pdf';
    
    if (isPdf) {
      throw new Error('PDF files are not supported. Please convert PDF to image (PNG/JPEG) before uploading.');
    }
    
    // Image: Use Vision API with normalized MIME type
    console.log('🖼️ Image detected, using Vision API...');
    console.log(`🔍 File type detection:`);
    console.log(`   Provided MIME type: ${fileType || 'none'}`);
    console.log(`   Detected MIME type: ${rawMimeType}`);
    console.log(`   Buffer start (hex): ${hexStart.substring(0, 16)}...`);
    const normalizedMimeType = normalizeImageMimeType(rawMimeType);
    console.log(`   Normalized MIME type: ${normalizedMimeType}`);
    
    const base64File = fileBuffer.toString('base64');
    const imageDataUrl = `data:${normalizedMimeType};base64,${base64File}`;
    console.log(`   Data URL prefix: data:${normalizedMimeType};base64,...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an OCR assistant that extracts structured data from freight documents. Return only valid JSON, no markdown or additional text."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ocrPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    let content = completion.choices[0]?.message?.content || '{}';
    const originalContent = content;

    if (!content || content === '{}' || content.trim().length === 0) {
      throw new Error('Empty response from OpenAI API');
    }

    // Clean JSON response - remove markdown code blocks
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    content = content.replace(/^\s+|\s+$/g, '');

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    // Transform charges array to match expected format
    const charges = parsed.charges && Array.isArray(parsed.charges) 
      ? parsed.charges 
      : [];

    return {
      journeyNumber: parsed.journeyNumber || undefined,
      vehicleNumber: parsed.vehicleNumber || undefined,
      loadId: parsed.loadId || undefined,
      charges: charges,
      totalAmount: parsed.totalAmount || undefined,
      confidence: parsed.confidence || 0.8,
      rawResponse: { content: originalContent, parsed },
    };
  } catch (error: any) {
    console.error('POD OCR Error:', error);
    return {
      confidence: 0,
      rawResponse: { error: error.message },
    };
  }
}

// ============================================================================
// INVOICE DOCUMENT OCR
// ============================================================================

/**
 * Extract metadata from Invoice document
 * @param fileBuffer - The file buffer (image or PDF)
 * @param fileType - MIME type of the file
 * @returns Extracted Invoice metadata with confidence score
 */
export async function extractInvoiceMetadata(
  fileBuffer: Buffer,
  fileType: string
): Promise<InvoiceOcrResult> {
  try {
    const ocrPrompt = `Extract the following information and return it as a JSON object:

Invoice Details:
- Transporter name
- Consignor name  
- Invoice No (look for "Invoice No" or "Invoice Number")
- Invoice Date (format as YYYY-MM-DD)
- LR No (look for "LR No" or "LR Number" - this is very important)
- LCU No
- Origin (city and state)
- Destination (city and state)

Charge Breakup:
- Base Freight (as number, no commas)
- Toll Charges (as number)
- Unloading Charges (as number)
- Other Add-on Charges (as number)
- Subtotal Before Tax (as number)
- SGST (as number)
- CGST (as number)
- Total Payable Amount (as number)

Material Details:
- Description
- Quantity in kg (as number)
- Packages

Return the data in this JSON format:
{
  "invoiceDetails": {
    "transporter": "...",
    "consignor": "...",
    "invoiceNo": "...",
    "invoiceDate": "YYYY-MM-DD",
    "lrNo": "...",
    "lcuNo": "...",
    "origin": "...",
    "destination": "..."
  },
  "chargeBreakup": {
    "baseFreight": 0,
    "tollCharges": 0,
    "unloadingCharges": 0,
    "otherAddOnCharges": 0,
    "subtotalBeforeTax": 0,
    "sgst": 0,
    "cgst": 0,
    "totalPayableAmount": 0
  },
  "materialDetails": {
    "description": "...",
    "quantityKg": 0,
    "packages": "..."
  }
}`;

    // Detect file type and normalize MIME type
    const rawMimeType = fileType || 'image/png';
    const isPdf = rawMimeType === 'application/pdf' || fileBuffer.slice(0, 4).toString() === '%PDF';
    
    if (isPdf) {
      throw new Error('PDF files are not supported. Please convert PDF to image (PNG/JPEG) before uploading.');
    }
    
    // Image: Use Vision API with normalized MIME type
    console.log('🖼️ Image detected, using Vision API...');
    const normalizedMimeType = normalizeImageMimeType(rawMimeType);
    console.log(`   Original MIME type: ${rawMimeType}`);
    console.log(`   Normalized MIME type: ${normalizedMimeType}`);
    
    const base64File = fileBuffer.toString('base64');
    const imageDataUrl = `data:${normalizedMimeType};base64,${base64File}`;
    console.log(`   Data URL prefix: data:${normalizedMimeType};base64,...`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an OCR assistant that extracts structured data from freight documents. Return only valid JSON, no markdown or additional text."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ocrPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    let content = completion.choices[0]?.message?.content || '{}';
    const originalContent = content;

    if (!content || content === '{}' || content.trim().length === 0) {
      throw new Error('Empty response from OpenAI API');
    }

    // Clean JSON response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    content = content.replace(/^\s+|\s+$/g, '');

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    // Extract from nested structure
    const invoiceDetails = parsed.invoiceDetails || {};
    const chargeBreakup = parsed.chargeBreakup || {};
    const materialDetails = parsed.materialDetails || {};

    // Build charges array from chargeBreakup
    const charges = [];
    if (chargeBreakup.tollCharges) charges.push({ type: 'Toll Charges', amount: chargeBreakup.tollCharges });
    if (chargeBreakup.unloadingCharges) charges.push({ type: 'Unloading Charges', amount: chargeBreakup.unloadingCharges });
    if (chargeBreakup.otherAddOnCharges) charges.push({ type: 'Other Add-on Charges', amount: chargeBreakup.otherAddOnCharges });
    if (chargeBreakup.sgst) charges.push({ type: 'SGST', amount: chargeBreakup.sgst });
    if (chargeBreakup.cgst) charges.push({ type: 'CGST', amount: chargeBreakup.cgst });

    return {
      invoiceNumber: invoiceDetails.invoiceNo || parsed.invoiceNumber || undefined,
      invoiceDate: invoiceDetails.invoiceDate || parsed.invoiceDate || undefined,
      journeyNumber: invoiceDetails.lrNo || parsed.journeyNumber || undefined,
      loadId: invoiceDetails.lcuNo || parsed.loadId || undefined,
      baseFreight: chargeBreakup.baseFreight || parsed.baseFreight || undefined,
      totalAmount: chargeBreakup.totalPayableAmount || parsed.totalAmount || undefined,
      charges: charges.length > 0 ? charges : (parsed.charges || []),
      confidence: parsed.confidence || 0.8,
      rawResponse: { content: originalContent, parsed },
      invoiceDetails: invoiceDetails,
      chargeBreakup: chargeBreakup,
      materialDetails: materialDetails,
    };
  } catch (error: any) {
    console.error('Invoice OCR Error:', error);
    return {
      confidence: 0,
      rawResponse: { error: error.message },
    };
  }
}
