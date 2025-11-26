// Google Gemini OCR Helper for Document Extraction
// Supports both POD and Invoice documents

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PodOcrResult, InvoiceOcrResult } from '../../src/types/domain';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    // Use Gemini 2.0 Flash for OCR processing (faster, better quota)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare prompt for POD extraction
    const prompt = `Extract all relevant fields from this POD (Proof of Delivery) document.

Read only what is present—no assumptions.

If the document contains multiple materials, capture every row accurately.

Return extracted data in a structured list of fields and values. No extra commentary.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "journeyNumber": "string or null",
  "vehicleNumber": "string or null",
  "loadId": "string or null",
  "charges": [
    {"type": "string", "amount": number}
  ],
  "totalAmount": number or null,
  "confidence": 0.8
}`;

    // Convert buffer to base64 for Gemini
    const base64File = fileBuffer.toString('base64');

    // Call Gemini with vision
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64File,
          mimeType: fileType,
        },
      },
    ]);

    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON response - Gemini may wrap in markdown
    let cleanedContent = content.trim();
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    // Remove any leading/trailing whitespace
    cleanedContent = cleanedContent.trim();

    const parsed = JSON.parse(cleanedContent);

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
      confidence: parsed.confidence || 0.8, // Default confidence for Gemini
      rawResponse: { content, parsed },
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
 * Extract financial data from Invoice document
 * @param fileBuffer - The file buffer (image or PDF)
 * @param fileType - MIME type of the file
 * @returns Extracted invoice data with confidence score
 */
export async function extractInvoiceMetadata(
  fileBuffer: Buffer,
  fileType: string
): Promise<InvoiceOcrResult> {
  try {
    // Use Gemini Pro for OCR processing (supports vision via inline data)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare prompt for Invoice extraction
    const prompt = `Extract all relevant fields from this freight INVOICE PDF.

Read exactly what is present in the document. Do not assume or infer missing values.

Accurately capture table rows even if formatting is inconsistent. Preserve numbers as printed.

Return the data in a clean and structured way with field names and values. No explanations.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "invoiceNumber": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "vehicleNumber": "string or null",
  "baseFreight": number or null,
  "detentionCharge": number or null,
  "tollCharge": number or null,
  "unloadingCharge": number or null,
  "otherCharges": number or null,
  "gstAmount": number or null,
  "totalAmount": number or null,
  "charges": [
    {"type": "string", "amount": number}
  ],
  "confidence": 0.8
}`;

    // Convert buffer to base64 for Gemini
    const base64File = fileBuffer.toString('base64');

    // Call Gemini with vision
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64File,
          mimeType: fileType,
        },
      },
    ]);

    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON response - Gemini may wrap in markdown
    let cleanedContent = content.trim();
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    // Remove any leading/trailing whitespace
    cleanedContent = cleanedContent.trim();

    const parsed = JSON.parse(cleanedContent);

    // Transform charges array to match expected format
    const charges = parsed.charges && Array.isArray(parsed.charges) 
      ? parsed.charges 
      : [];

    return {
      invoiceNumber: parsed.invoiceNumber || undefined,
      invoiceDate: parsed.invoiceDate || undefined,
      vehicleNumber: parsed.vehicleNumber || undefined,
      baseFreight: parsed.baseFreight || undefined,
      detentionCharge: parsed.detentionCharge || 0,
      tollCharge: parsed.tollCharge || 0,
      unloadingCharge: parsed.unloadingCharge || 0,
      otherCharges: parsed.otherCharges || 0,
      gstAmount: parsed.gstAmount || undefined,
      totalAmount: parsed.totalAmount || undefined,
      charges: charges,
      confidence: parsed.confidence || 0.8, // Default confidence for Gemini
      rawResponse: { content, parsed },
    };
  } catch (error: any) {
    console.error('Invoice OCR Error:', error);
    return {
      confidence: 0,
      rawResponse: { error: error.message },
    };
  }
}

// ============================================================================
// MATCHING HELPERS
// ============================================================================

/**
 * Match POD extracted data with journey
 * @param ocrResult - OCR extraction result
 * @param journey - Journey to match against
 * @returns Match result with details
 */
export function matchPodWithJourney(
  ocrResult: PodOcrResult,
  journey: { journey_number: string; vehicle_number: string; load_id?: string }
) {
  const matches = {
    journeyNumber: false,
    vehicleNumber: false,
    loadId: false,
  };

  let matchScore = 0;
  const details: string[] = [];

  // Normalize strings for comparison
  const normalize = (str?: string) => str?.trim().toUpperCase().replace(/\s+/g, '') || '';

  // Check journey number
  if (ocrResult.journeyNumber && journey.journey_number) {
    matches.journeyNumber = normalize(ocrResult.journeyNumber) === normalize(journey.journey_number);
    if (matches.journeyNumber) {
      matchScore += 0.4;
      details.push('Journey number matched');
    } else {
      details.push(`Journey number mismatch: ${ocrResult.journeyNumber} vs ${journey.journey_number}`);
    }
  }

  // Check vehicle number
  if (ocrResult.vehicleNumber && journey.vehicle_number) {
    matches.vehicleNumber = normalize(ocrResult.vehicleNumber) === normalize(journey.vehicle_number);
    if (matches.vehicleNumber) {
      matchScore += 0.4;
      details.push('Vehicle number matched');
    } else {
      details.push(`Vehicle number mismatch: ${ocrResult.vehicleNumber} vs ${journey.vehicle_number}`);
    }
  }

  // Check load ID (optional)
  if (ocrResult.loadId && journey.load_id) {
    matches.loadId = normalize(ocrResult.loadId) === normalize(journey.load_id);
    if (matches.loadId) {
      matchScore += 0.2;
      details.push('Load ID matched');
    } else {
      details.push(`Load ID mismatch: ${ocrResult.loadId} vs ${journey.load_id}`);
    }
  }

  const isMatch = matchScore >= 0.4; // At least one major field must match
  const status = isMatch ? 'matched' : 'mismatch';

  return {
    isMatch,
    status,
    matchScore,
    matches,
    details,
  };
}

/**
 * Match Invoice extracted data with proforma
 * @param ocrResult - OCR extraction result
 * @param proforma - Proforma to match against
 * @returns Match result with variance details
 */
export function matchInvoiceWithProforma(
  ocrResult: InvoiceOcrResult,
  proforma: {
    base_freight: number;
    detention_charge: number;
    toll_charge: number;
    unloading_charge: number;
    other_charges: number;
    gst_amount: number;
    total_amount: number;
  }
) {
  const variances = {
    baseFreight: 0,
    detentionCharge: 0,
    tollCharge: 0,
    unloadingCharge: 0,
    otherCharges: 0,
    gstAmount: 0,
    totalAmount: 0,
  };

  const details: string[] = [];

  // Calculate variances
  if (ocrResult.baseFreight !== undefined) {
    variances.baseFreight = ocrResult.baseFreight - proforma.base_freight;
    if (variances.baseFreight !== 0) {
      details.push(`Base freight variance: ₹${variances.baseFreight.toFixed(2)}`);
    }
  }

  if (ocrResult.detentionCharge !== undefined) {
    variances.detentionCharge = ocrResult.detentionCharge - proforma.detention_charge;
  }

  if (ocrResult.tollCharge !== undefined) {
    variances.tollCharge = ocrResult.tollCharge - proforma.toll_charge;
  }

  if (ocrResult.unloadingCharge !== undefined) {
    variances.unloadingCharge = ocrResult.unloadingCharge - proforma.unloading_charge;
  }

  if (ocrResult.otherCharges !== undefined) {
    variances.otherCharges = ocrResult.otherCharges - proforma.other_charges;
  }

  if (ocrResult.gstAmount !== undefined) {
    variances.gstAmount = ocrResult.gstAmount - proforma.gst_amount;
  }

  if (ocrResult.totalAmount !== undefined) {
    variances.totalAmount = ocrResult.totalAmount - proforma.total_amount;
    if (variances.totalAmount !== 0) {
      details.push(`Total amount variance: ₹${variances.totalAmount.toFixed(2)}`);
    }
  }

  // Calculate total variance and percentage
  const totalVariance = variances.totalAmount;
  const variancePercentage = proforma.total_amount > 0
    ? (totalVariance / proforma.total_amount) * 100
    : 0;

  // Determine match status
  let matchStatus = 'exact_match';
  if (Math.abs(variances.baseFreight) > 0.01 && Math.abs(variances.totalAmount) < 0.01) {
    matchStatus = 'base_freight_diff';
  } else if (Math.abs(variances.totalAmount) > 0.01) {
    matchStatus = 'charges_diff';
  }

  const isMatch = matchStatus === 'exact_match';

  return {
    isMatch,
    matchStatus,
    variances,
    totalVariance,
    variancePercentage,
    details,
  };
}
