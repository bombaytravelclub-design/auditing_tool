// Bulk Upload API - POD and Invoice Document Processing
import { createClient } from '@supabase/supabase-js';
import { extractPodMetadata, extractInvoiceMetadata } from './_lib/ocr';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

    // Process each file
    for (const file of files) {
      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(file.data, 'base64');
        
        // Upload to Supabase Storage
        const storagePath = type.toLowerCase() === 'invoice' ? 'invoice' : 'pod';
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`${storagePath}/${fileName}`, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: 'Upload failed',
          });
          continue;
        }

        // Get file URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(`${storagePath}/${fileName}`);

        // Extract metadata using OCR (use appropriate function based on document type)
        let ocrResult: any;
        try {
          if (type.toLowerCase() === 'invoice') {
            console.log(`📄 Extracting invoice metadata for ${file.name}...`);
            ocrResult = await extractInvoiceMetadata(fileBuffer, file.type);
            // Normalize invoice OCR result to match POD format for matching
            ocrResult = {
              journeyNumber: ocrResult.journeyNumber || ocrResult.invoiceDetails?.lrNo,
              vehicleNumber: ocrResult.vehicleNumber || ocrResult.invoiceDetails?.vehicleNumber,
              loadId: ocrResult.loadId || ocrResult.invoiceDetails?.lcuNo,
              confidence: ocrResult.confidence || 0.8,
              invoiceNumber: ocrResult.invoiceNumber || ocrResult.invoiceDetails?.invoiceNo,
              charges: ocrResult.charges || ocrResult.chargeBreakup,
              totalAmount: ocrResult.totalAmount || ocrResult.chargeBreakup?.totalPayableAmount,
            };
          } else {
            console.log(`📄 Extracting POD metadata for ${file.name}...`);
            ocrResult = await extractPodMetadata(fileBuffer, file.type);
          }
          
          console.log(`📄 OCR Result for ${file.name}:`, {
            journeyNumber: ocrResult.journeyNumber,
            vehicleNumber: ocrResult.vehicleNumber,
            loadId: ocrResult.loadId,
            confidence: ocrResult.confidence,
            invoiceNumber: ocrResult.invoiceNumber,
          });
        } catch (ocrError: any) {
          console.error(`❌ OCR extraction failed for ${file.name}:`, ocrError);
          console.error('   Error stack:', ocrError.stack);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: `OCR failed: ${ocrError.message}`,
          });
          continue;
        }

        // Find matching journey using sophisticated matching logic
        const matchedJourney = findMatchingJourney(ocrResult, allJourneys);

        // Determine match status
        const isMatched = !!matchedJourney;
        const needsReview = !isMatched && (ocrResult.journeyNumber || ocrResult.loadId);

        if (isMatched) matchedCount++;
        if (needsReview) needsReviewCount++;

        // Prepare OCR extracted data for storage
        const ocrExtractedData: any = {
          journeyNumber: ocrResult.journeyNumber,
          vehicleNumber: ocrResult.vehicleNumber,
          loadId: ocrResult.loadId,
          confidence: ocrResult.confidence,
        };

        // Insert into bulk_job_items
        const { data: jobItem, error: itemError } = await supabase
          .from('bulk_job_items')
          .insert({
            bulk_job_id: bulkJob.id,
            file_name: file.name,
            file_url: urlData?.publicUrl,
            journey_id: matchedJourney?.id || null,
            ocr_extracted_data: ocrExtractedData,
            match_status: isMatched ? 'matched' : needsReview ? 'needs_review' : 'skipped',
            match_score: isMatched ? 100 : needsReview ? 50 : 0,
            match_reason: isMatched 
              ? `LR Number matched: ${ocrResult.journeyNumber} = ${matchedJourney?.journey_number}`
              : needsReview 
                ? 'Needs review - LR Number found but no match'
                : 'No LR Number found in OCR',
            status: 'pending_review',
          })
          .select()
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
          continue;
        }

        console.log(`✅ Created job item for ${file.name}:`, jobItem?.id);

        processedItems.push({
          fileName: file.name,
          status: isMatched ? 'matched' : needsReview ? 'needs_review' : 'skipped',
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
      }
    }

    // Update bulk job with final counts
    await supabase
      .from('bulk_jobs')
      .update({
        processed_files: files.length,
        matched_files: matchedCount,
        mismatch_files: needsReviewCount,
        failed_files: files.length - matchedCount - needsReviewCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkJob.id);

    return res.status(200).json({
      success: true,
      jobId: bulkJob.id,
      summary: {
        totalFiles: files.length,
        matched: matchedCount,
        needsReview: needsReviewCount,
        skipped: files.length - matchedCount - needsReviewCount,
      },
      items: processedItems,
    });

  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
