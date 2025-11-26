// GPT-4o OCR Helper for Document Extraction
// Supports both POD and Invoice documents

import OpenAI from 'openai';
import type { PodOcrResult, InvoiceOcrResult } from '../../src/types/domain';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    // Convert buffer to base64
    const base64File = fileBuffer.toString('base64');
    const dataUrl = `data:${fileType};base64,${base64File}`;

    // Prepare prompt for POD extraction
    const prompt = `Extract the following information from this Proof of Delivery (POD) document:

1. Journey Number / Trip ID / Consignment Number
2. Vehicle Number / Registration Number
3. Load ID / Shipment ID
4. Any other identifying numbers

Return the data in this exact JSON format:
{
  "journeyNumber": "string or null",
  "vehicleNumber": "string or null",
  "loadId": "string or null",
  "confidence": number between 0 and 1
}

Rules:
- Extract all numbers/IDs accurately
- If a field is not found, set it to null
- Confidence should reflect how clear the data is (0.0 to 1.0)
- Only return the JSON, no additional text`;

    // Call GPT-4o with vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const cleanedContent = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const parsed = JSON.parse(cleanedContent);

    return {
      journeyNumber: parsed.journeyNumber || undefined,
      vehicleNumber: parsed.vehicleNumber || undefined,
      loadId: parsed.loadId || undefined,
      confidence: parsed.confidence || 0,
      rawResponse: response,
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
    // Convert buffer to base64
    const base64File = fileBuffer.toString('base64');
    const dataUrl = `data:${fileType};base64,${base64File}`;

    // Prepare prompt for Invoice extraction
    const prompt = `Extract the following financial information from this freight invoice document:

1. Invoice Number
2. Invoice Date
3. Vehicle Number / Registration Number
4. Base Freight / Freight Charges
5. Detention Charges
6. Toll Charges
7. Unloading Charges
8. Other Charges / Miscellaneous
9. GST Amount / Tax Amount
10. Total Amount / Grand Total

Return the data in this exact JSON format:
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
  "confidence": number between 0 and 1
}

Rules:
- Extract all amounts as numbers (no currency symbols)
- If a charge type is not present, set it to 0
- If a field cannot be found, set it to null
- Confidence should reflect how clear the data is (0.0 to 1.0)
- Date format should be YYYY-MM-DD
- Only return the JSON, no additional text`;

    // Call GPT-4o with vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const cleanedContent = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const parsed = JSON.parse(cleanedContent);

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
      confidence: parsed.confidence || 0,
      rawResponse: response,
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

