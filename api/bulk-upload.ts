// Bulk Upload API - POD and Invoice Document Processing
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// STATIC INVOICE DATA (NO OCR - Use this dataset only)
// ============================================================================
const STATIC_INVOICES: Record<string, any> = {
  "INV-24001": {
    "invoiceNumber": "INV-24001",
    "lrNumber": "LR20257713",
    "lcuNumber": "LCU95304199",
    "transporter": "Global Logistics Inc",
    "consignor": "Acme Chemicals Pvt Ltd",
    "invoiceDate": "2025-01-15",
    "origin": "Bangalore, KA",
    "destination": "Surat, GJ",
    "chargeBreakup": {
      "baseFreight": 47727.03,
      "tollCharges": 516.75,
      "unloadingCharges": 1052.18,
      "otherAddOnCharges": 0,
      "subtotalBeforeTax": 49295.96,
      "sgst": 2957.76,
      "cgst": 2957.76,
      "totalPayableAmount": 58169.23
    },
    "materialDetails": {
      "description": "Industrial chemicals (non-hazardous)",
      "quantityKg": 1764,
      "packages": "18 Drums"
    }
  },
  "INV-24005": {
    "invoiceNumber": "INV-24005",
    "lrNumber": "LR20252184",
    "lcuNumber": "LCU33441066",
    "transporter": "Global Logistics Inc",
    "consignor": "Acme Chemicals Pvt Ltd",
    "invoiceDate": "2025-01-19",
    "origin": "Bangalore, KA",
    "destination": "Hyderabad, TS",
    "chargeBreakup": {
      "baseFreight": 53933.31,
      "tollCharges": 5748.06,
      "unloadingCharges": 1200,
      "otherAddOnCharges": 0,
      "subtotalBeforeTax": 60881.37,
      "sgst": 3652.88,
      "cgst": 3652.88,
      "totalPayableAmount": 68187.13
    },
    "materialDetails": {
      "description": "Specialty additives",
      "quantityKg": 1800,
      "packages": "18 Drums"
    }
  }
};

// ============================================================================
// STATIC DATA LOOKUP FUNCTION (NO OCR)
// ============================================================================
function getStaticInvoiceData(fileName: string): {
  error: string | null;
  source?: string;
  matchedInvoice?: string;
  parsedData?: any;
  fileName: string;
} {
  // Extract invoice number from filename (e.g., "invoice_INV-24001.pdf" -> "INV-24001")
  const invoiceMatch = fileName.match(/INV-\d+/);
  if (!invoiceMatch) {
    return {
      error: "STATIC_DATA_NOT_FOUND",
      message: "Could not extract invoice number from filename.",
      fileName: fileName
    };
  }

  const invoiceNumber = invoiceMatch[0];
  const staticData = STATIC_INVOICES[invoiceNumber];

  if (!staticData) {
    return {
      error: "STATIC_DATA_NOT_FOUND",
      message: "This invoice does not exist in the static dataset.",
      fileName: fileName
    };
  }

  return {
    error: null,
    source: "STATIC",
    matchedInvoice: invoiceNumber,
    parsedData: staticData
  };
}
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Ensure we're using service role for storage operations
    global: {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  }
);

// LR Number normalization function (same as local server)
function normalizeLR(value: any): string {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // removes spaces, dashes, /, etc.
}

// Find matching journey by LR number (primary) and Load ID (fallback)
function findMatchingJourney(ocrData: any, journeysList: any[]) {
  if (!ocrData || !journeysList || journeysList.length === 0) {
    return null;
  }

  // Extract LR and LCU from OCR (try multiple field names)
  const ocrLRRaw = ocrData.journeyNumber || ocrData.invoiceDetails?.lrNo || ocrData.lrNo || ocrData.lr_number;
  const ocrLR = normalizeLR(ocrLRRaw);
  const ocrLoadRaw = ocrData.loadId || ocrData.invoiceDetails?.lcuNo || ocrData.lcuNo || ocrData.lcu_no;
  const ocrLoad = normalizeLR(ocrLoadRaw);

  console.log(`🔍 Finding matching journey:`);
  console.log(`   OCR LR (raw): "${ocrLRRaw}" → normalized: "${ocrLR}"`);
  console.log(`   OCR Load ID (raw): "${ocrLoadRaw}" → normalized: "${ocrLoad}"`);
  console.log(`   Available journeys: ${journeysList.length}`);

  if (!ocrLR || ocrLR === '') {
    console.log(`   ⚠️ WARNING: OCR LR is empty after normalization!`);
    return null;
  }

  // Primary match: Match on journey_number (which IS the LR Number)
  for (const journey of journeysList) {
    if (journey.journey_number) {
      const journeyLR = normalizeLR(journey.journey_number);
      if (journeyLR === ocrLR) {
        console.log(`   ✅✅✅ EXACT MATCH FOUND BY journey_number! ✅✅✅`);
        console.log(`      OCR LR: "${ocrLR}"`);
        console.log(`      DB journey_number: "${journey.journey_number}" (normalized: "${journeyLR}")`);
        console.log(`      Journey ID: ${journey.id}`);
        return journey;
      }
    }
  }

  // Fallback: Match on Load ID/LCU
  if (ocrLoad) {
    for (const journey of journeysList) {
      if (journey.load_id) {
        const journeyLoad = normalizeLR(journey.load_id);
        if (journeyLoad === ocrLoad) {
          console.log(`   ✅ Matched by Load ID/LCU: ${journey.load_id} (Journey ID: ${journey.id})`);
          return journey;
        }
      }
    }
  }

  console.log(`   ❌ NO MATCH FOUND`);
  const availableLRs = journeysList.map(j => j.journey_number).filter(Boolean).slice(0, 10);
  console.log(`   Available journey_number (LR) values:`, availableLRs);
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, journeyIds, files } = req.body;

    if (!type || !journeyIds || !Array.isArray(journeyIds) || journeyIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: type, journeyIds' });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Create bulk job record
    const { data: bulkJob, error: jobError } = await supabase
      .from('bulk_jobs')
      .insert({
        job_type: type.toLowerCase(),
        total_files: files.length,
        processed_files: 0,
        matched_files: 0,
        mismatch_files: 0,
        failed_files: 0,
        status: 'processing',
        uploaded_by: null,
      })
      .select()
      .single();

    if (jobError || !bulkJob) {
      console.error('Error creating bulk job:', jobError);
      return res.status(500).json({ error: 'Failed to create bulk job' });
    }

    // IMPORTANT: Fetch ALL journeys from database for matching, not just selected ones
    // This allows OCR to match any journey by LR number, even if user didn't select it
    console.log(`🔍 Fetching ALL journeys from database for matching (not just selected ones)...`);
    
    const { data: allJourneys, error: journeysError } = await supabase
      .from('journeys')
      .select('id, journey_number, load_id, vehicle_number, epod_status');

    if (journeysError) {
      console.error('Error fetching journeys:', journeysError);
      return res.status(500).json({ error: 'Failed to fetch journeys' });
    }

    if (!allJourneys || allJourneys.length === 0) {
      console.error('❌ No journeys found in database!');
      return res.status(500).json({ error: 'No journeys found in database' });
    }

    console.log(`✅ Fetched ${allJourneys.length} journeys for matching`);

    const processedItems = [];
    let matchedCount = 0;
    let needsReviewCount = 0;
    let failedCount = 0;

    // Process each file
    for (const file of files) {
      try {
        // ============================================================================
        // STATIC DATA LOOKUP (NO OCR - Ignore file content completely)
        // ============================================================================
        console.log(`📄 Processing file: ${file.name} (STATIC DATA MODE - NO OCR)`);
        
        // Extract invoice number from filename
        const staticDataResult = getStaticInvoiceData(file.name);
        
        if (staticDataResult.error) {
          console.error(`❌ Static data lookup failed for ${file.name}:`, staticDataResult.error);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: staticDataResult.error === 'STATIC_DATA_NOT_FOUND' 
              ? staticDataResult.message || 'Invoice not found in static dataset'
              : 'Could not extract invoice number from filename',
          });
          failedCount++;
          continue;
        }

        const parsedData = staticDataResult.parsedData;
        console.log(`✅ Found static data for ${staticDataResult.matchedInvoice}:`, {
          invoiceNumber: parsedData.invoiceNumber,
          lrNumber: parsedData.lrNumber,
          lcuNumber: parsedData.lcuNumber,
        });

        // Upload file to storage (still need to store the file, but don't read content)
        const fileBuffer = Buffer.from(file.data, 'base64');
        const storagePath = type.toLowerCase() === 'invoice' ? 'invoice' : 'pod';
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fullStoragePath = `${storagePath}/${fileName}`;
        
        console.log(`📤 Uploading file to storage: ${fullStoragePath}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fullStoragePath, fileBuffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: `Upload failed: ${uploadError.message}`,
          });
          failedCount++;
          continue;
        }
        
        console.log(`✅ File uploaded successfully: ${fullStoragePath}`);

        // Get file URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fullStoragePath);

        // Match using static data (LR number and LCU number)
        // Create a data structure compatible with findMatchingJourney
        const staticDataForMatching = {
          journeyNumber: parsedData.lrNumber,
          loadId: parsedData.lcuNumber,
          lrNumber: parsedData.lrNumber,
          lcuNumber: parsedData.lcuNumber,
        };

        const matchedJourney = findMatchingJourney(staticDataForMatching, allJourneys);

        console.log(`🔍 Matching result for ${file.name}:`, {
          matchedJourney: matchedJourney ? matchedJourney.id : null,
          lrNumber: parsedData.lrNumber,
          lcuNumber: parsedData.lcuNumber,
        });

        // Determine match status (matched if journey found, needs_review otherwise)
        const isMatched = !!matchedJourney;
        const matchStatus: 'matched' | 'mismatch' = isMatched ? 'matched' : 'mismatch';
        
        console.log(`📊 Match status for ${file.name}:`, {
          isMatched,
          matchStatus,
          lrNumber: parsedData.lrNumber,
          lcuNumber: parsedData.lcuNumber,
        });

        // Fetch proforma data for contract comparison
        let proforma = null;
        let contractComparison: any = {
          baseFreight: { contracted: null, invoice: null, variance: null },
          tollCharges: { contracted: null, invoice: null, variance: null },
          unloadingCharges: { contracted: null, invoice: null, variance: null },
          otherAddOnCharges: { contracted: null, invoice: null, variance: null },
        };
        
        if (matchedJourney && type.toLowerCase() === 'invoice') {
          const { data: proformaData } = await supabase
            .from('proformas')
            .select('id, base_freight, toll_charge, unloading_charge, other_charges, total_amount')
            .eq('journey_id', matchedJourney.id)
            .limit(1)
            .single();
          proforma = proformaData;
          
          // Map proforma charges to invoice charges and calculate variance
          const chargeBreakup = parsedData.chargeBreakup || {};
          
          contractComparison = {
            baseFreight: {
              contracted: proforma?.base_freight || 0,
              invoice: chargeBreakup.baseFreight || 0,
              variance: (chargeBreakup.baseFreight || 0) - (proforma?.base_freight || 0),
            },
            tollCharges: {
              contracted: proforma?.toll_charge || 0,
              invoice: chargeBreakup.tollCharges || 0,
              variance: (chargeBreakup.tollCharges || 0) - (proforma?.toll_charge || 0),
            },
            unloadingCharges: {
              contracted: proforma?.unloading_charge || 0,
              invoice: chargeBreakup.unloadingCharges || 0,
              variance: (chargeBreakup.unloadingCharges || 0) - (proforma?.unloading_charge || 0),
            },
            otherAddOnCharges: {
              contracted: proforma?.other_charges || 0,
              invoice: chargeBreakup.otherAddOnCharges || 0,
              variance: (chargeBreakup.otherAddOnCharges || 0) - (proforma?.other_charges || 0),
            },
          };
        }

        // Prepare extracted data for storage (using static data structure)
        const extractedData: any = {
          source: 'STATIC',
          invoiceNumber: parsedData.invoiceNumber,
          lrNumber: parsedData.lrNumber,
          lcuNumber: parsedData.lcuNumber,
          origin: parsedData.origin,
          destination: parsedData.destination,
          transporter: parsedData.transporter,
          consignor: parsedData.consignor,
          invoiceDate: parsedData.invoiceDate,
          chargeBreakup: parsedData.chargeBreakup,
          materialDetails: parsedData.materialDetails,
          // For backward compatibility with existing code
          journeyNumber: parsedData.lrNumber,
          loadId: parsedData.lcuNumber,
          totalAmount: parsedData.chargeBreakup?.totalPayableAmount || null,
          baseFreight: parsedData.chargeBreakup?.baseFreight || null,
        };

        // Prepare match_details JSONB
        const matchDetails = {
          isMatched,
          matchScore: isMatched ? 100 : 0,
          matchReason: isMatched 
            ? `LR Number matched: ${parsedData.lrNumber} = ${matchedJourney?.journey_number}`
            : 'No matching journey found for LR/LCU number',
          matchDetails: isMatched ? [`LR Number matched: ${parsedData.lrNumber}`] : [],
          contractComparison: contractComparison,
        };

        // Insert into bulk_job_items
        // fullStoragePath is already defined above (line 182)
        console.log(`📝 Inserting bulk_job_item for ${file.name}:`, {
          bulk_job_id: bulkJob.id,
          file_name: file.name,
          storage_path: storagePath,
          match_status: matchStatus,
          journey_id: matchedJourney?.id || null,
        });

        // BULK_ITEM_INSERT_DEBUG - Comprehensive debug logging
        console.log('BULK_ITEM_INSERT_DEBUG', {
          env: process.env.VERCEL ? 'vercel' : 'local',
          bulk_job_id: bulkJob.id,
          file_name: file.name,
          match_status: matchStatus,
          journey_id: matchedJourney?.id ?? null,
          proforma_id: proforma?.id ?? null,
          invoiceNumber: parsedData.invoiceNumber,
          lrNumber: parsedData.lrNumber,
          lcuNumber: parsedData.lcuNumber,
          isMatched: isMatched,
          contractComparison: contractComparison,
        });

        const { data: jobItem, error: itemError } = await supabase
          .from('bulk_job_items')
          .insert({
            bulk_job_id: bulkJob.id,
            file_name: file.name,
            storage_path: fullStoragePath, // Use storage_path, not file_url
            journey_id: matchedJourney?.id || null,
            ocr_extracted_data: extractedData,
            ocr_confidence: null, // No OCR, so no confidence score
            match_status: matchStatus, // Use correct enum value
            match_details: matchDetails, // Store match details in JSONB
          })
          .select('id, bulk_job_id, file_name, match_status, journey_id')
          .single();

        if (itemError) {
          console.error(`❌ Error creating job item for ${file.name}:`, itemError);
          console.error('   Error code:', itemError.code);
          console.error('   Error message:', itemError.message);
          console.error('   Error details:', itemError.details);
          console.error('   Error hint:', itemError.hint);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: `Database insert failed: ${itemError.message}`,
          });
          // Count as failed since insertion didn't succeed
          failedCount++;
          continue;
        }

        if (!jobItem || !jobItem.id) {
          console.error(`❌ Job item created but no ID returned for ${file.name}`);
          console.error('   Response:', jobItem);
          failedCount++;
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: 'Item created but no ID returned',
          });
          continue;
        }

        console.log(`✅ Created job item for ${file.name}:`, jobItem.id);
        console.log(`   Match status: ${matchStatus}`);
        console.log(`   Journey ID: ${matchedJourney?.id || 'null'}`);

        // Verify item was actually saved
        const { data: verifyItem, error: verifyError } = await supabase
          .from('bulk_job_items')
          .select('id, match_status, journey_id')
          .eq('id', jobItem.id)
          .single();

        if (verifyError || !verifyItem) {
          console.error(`⚠️ Warning: Could not verify item ${jobItem.id} was saved:`, verifyError);
        } else {
          console.log(`✅ Verified item ${jobItem.id} exists in database`);
        }

        // Only increment counts AFTER successful insertion
        if (isMatched) {
          matchedCount++;
        } else if (needsReview) {
          needsReviewCount++;
        } else {
          failedCount++;
        }

        processedItems.push({
          fileName: file.name,
          status: isMatched ? 'matched' : needsReview ? 'mismatch' : 'skipped',
          matchedJourneyId: matchedJourney?.id,
          matchScore: isMatched ? 100 : needsReview ? 50 : 0,
          ocrData: ocrExtractedData,
        });

      } catch (error: any) {
        console.error('Error processing file:', file.name, error);
        processedItems.push({
          fileName: file.name,
          status: 'skipped',
          reason: error.message,
        });
        failedCount++;
      }
    }

    // Verify items were actually saved before updating counts
    const { data: savedItems, error: verifyItemsError } = await supabase
      .from('bulk_job_items')
      .select('id, match_status')
      .eq('bulk_job_id', bulkJob.id);

    if (verifyItemsError) {
      console.error('❌ Error verifying saved items:', verifyItemsError);
    } else {
      console.log(`📊 Verification: Found ${savedItems?.length || 0} items in database for job ${bulkJob.id}`);
      if (savedItems && savedItems.length > 0) {
        const savedMatched = savedItems.filter(i => i.match_status === 'matched').length;
        const savedMismatch = savedItems.filter(i => i.match_status === 'mismatch').length;
        const savedSkipped = savedItems.filter(i => i.match_status === 'skipped').length;
        console.log(`   Saved items breakdown: matched=${savedMatched}, mismatch=${savedMismatch}, skipped=${savedSkipped}`);
      }
    }

    // Update bulk job with final counts
    // Verify counts add up correctly
    const totalCounted = matchedCount + needsReviewCount + failedCount;
    console.log(`📊 Final counts:`, {
      totalFiles: files.length,
      matched: matchedCount,
      needsReview: needsReviewCount,
      failed: failedCount,
      totalCounted: totalCounted,
      difference: files.length - totalCounted,
      savedItemsInDb: savedItems?.length || 0,
    });
    
    // Ensure failedCount accounts for any uncounted files (shouldn't happen, but safety check)
    const finalFailedCount = failedCount + Math.max(0, files.length - totalCounted);
    
    const { error: updateError } = await supabase
      .from('bulk_jobs')
      .update({
        processed_files: files.length,
        matched_files: matchedCount,
        mismatch_files: needsReviewCount,
        failed_files: finalFailedCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkJob.id);

    if (updateError) {
      console.error('❌ Error updating bulk job:', updateError);
    } else {
      console.log(`✅ Updated bulk job ${bulkJob.id} with final counts`);
    }

    return res.status(200).json({
      success: true,
      jobId: bulkJob.id,
      summary: {
        totalFiles: files.length,
        matched: matchedCount,
        needsReview: needsReviewCount,
        skipped: failedCount,
      },
      items: processedItems,
    });

  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
