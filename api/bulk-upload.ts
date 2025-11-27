// Bulk Upload API - POD and Invoice Document Processing
import { createClient } from '@supabase/supabase-js';
import { extractPodMetadata, extractInvoiceMetadata } from './_lib/ocr';
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
        // Decode base64 file data
        const fileBuffer = Buffer.from(file.data, 'base64');
        
        // Detect file type from buffer content (more reliable than extension/MIME type)
        let detectedMimeType = file.type;
        
        // Check buffer magic bytes to determine actual file type
        const bufferStart = fileBuffer.slice(0, 12);
        const hexStart = bufferStart.toString('hex');
        const textStart = bufferStart.toString('ascii');
        
        // Detect by magic bytes (most reliable)
        if (textStart.startsWith('%PDF')) {
          detectedMimeType = 'application/pdf';
        } else if (hexStart.startsWith('ffd8')) {
          // JPEG: FF D8 FF
          detectedMimeType = 'image/jpeg';
        } else if (hexStart.startsWith('89504e470d0a1a0a')) {
          // PNG: 89 50 4E 47 0D 0A 1A 0A
          detectedMimeType = 'image/png';
        } else if (hexStart.startsWith('474946')) {
          // GIF: 47 49 46 38 (GIF8)
          detectedMimeType = 'image/gif';
        } else if (hexStart.startsWith('52494646') && bufferStart.slice(8, 12).toString('ascii') === 'WEBP') {
          // WebP: RIFF....WEBP
          detectedMimeType = 'image/webp';
        } else if (!detectedMimeType || detectedMimeType === 'application/octet-stream') {
          // If we can't detect and no MIME type provided, default to PNG
          detectedMimeType = 'image/png';
        }
        
        console.log(`📄 File detection for ${file.name}:`);
        console.log(`   Provided MIME type: ${file.type || 'none'}`);
        console.log(`   Detected MIME type: ${detectedMimeType}`);
        console.log(`   Buffer start (hex): ${hexStart.substring(0, 16)}...`);
        
        // Reject PDFs BEFORE uploading or processing
        if (detectedMimeType === 'application/pdf' || textStart.startsWith('%PDF')) {
          console.error(`❌ PDF files are not supported. File "${file.name}" is a PDF.`);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: 'PDF files are not supported. Please convert PDF to image (PNG/JPEG) before uploading.',
          });
          failedCount++;
          continue;
        }
        
        // Validate that we have a valid image MIME type
        const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validImageTypes.includes(detectedMimeType)) {
          console.error(`❌ Invalid image format: ${detectedMimeType}`);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: `Invalid image format: ${detectedMimeType}. Only PNG, JPEG, GIF, and WebP are supported.`,
          });
          failedCount++;
          continue;
        }
        
        console.log(`📄 File: ${file.name}, Detected MIME type: ${detectedMimeType}`);
        
        // Upload to Supabase Storage
        const storagePath = type.toLowerCase() === 'invoice' ? 'invoice' : 'pod';
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fullStoragePath = `${storagePath}/${fileName}`;
        
        console.log(`📤 Uploading file to storage: ${fullStoragePath}`);
        console.log(`   File size: ${fileBuffer.length} bytes`);
        console.log(`   MIME type: ${detectedMimeType}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fullStoragePath, fileBuffer, {
            contentType: detectedMimeType,
            upsert: false,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
          console.error('   Error code:', uploadError.statusCode);
          console.error('   Error message:', uploadError.message);
          console.error('   Error name:', uploadError.name);
          
          // If RLS error, provide helpful message
          if (uploadError.statusCode === '403' || uploadError.message?.includes('row-level security')) {
            console.error('   ⚠️ RLS Policy Error: Storage bucket has RLS enabled.');
            console.error('   Solution: Go to Supabase Dashboard → Storage → documents bucket → Policies');
            console.error('   Create a policy that allows INSERT for service role or disable RLS for this bucket.');
          }
          
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: `Upload failed: ${uploadError.message || 'Storage RLS policy blocked upload'}`,
          });
          failedCount++;
          continue;
        }
        
        console.log(`✅ File uploaded successfully: ${fullStoragePath}`);

        // Get file URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fullStoragePath);

        // Extract metadata using OCR (use appropriate function based on document type)
        let ocrResult: any;
        try {
          if (type.toLowerCase() === 'invoice') {
            console.log(`📄 Extracting invoice metadata for ${file.name}...`);
            ocrResult = await extractInvoiceMetadata(fileBuffer, detectedMimeType);
            // Ensure journeyNumber is extracted from nested structure if needed
            if (!ocrResult.journeyNumber && ocrResult.invoiceDetails?.lrNo) {
              ocrResult.journeyNumber = ocrResult.invoiceDetails.lrNo;
            }
            // Ensure loadId is extracted from nested structure if needed
            if (!ocrResult.loadId && ocrResult.invoiceDetails?.lcuNo) {
              ocrResult.loadId = ocrResult.invoiceDetails.lcuNo;
            }
          } else {
            console.log(`📄 Extracting POD metadata for ${file.name}...`);
            ocrResult = await extractPodMetadata(fileBuffer, detectedMimeType);
          }
          
          console.log(`📄 OCR Result for ${file.name}:`, {
            journeyNumber: ocrResult.journeyNumber,
            vehicleNumber: ocrResult.vehicleNumber,
            loadId: ocrResult.loadId,
            confidence: ocrResult.confidence,
            invoiceNumber: ocrResult.invoiceNumber,
            hasInvoiceDetails: !!ocrResult.invoiceDetails,
            invoiceDetailsLrNo: ocrResult.invoiceDetails?.lrNo,
          });
        } catch (ocrError: any) {
          console.error(`❌ OCR extraction failed for ${file.name}:`, ocrError);
          console.error('   Error stack:', ocrError.stack);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: `OCR failed: ${ocrError.message}`,
          });
          failedCount++;
          continue;
        }

        // Check if OCR failed (returns error object) - check BEFORE counting
        if (ocrResult.rawResponse?.error) {
          console.error(`❌ OCR returned error for ${file.name}:`, ocrResult.rawResponse.error);
          processedItems.push({
            fileName: file.name,
            status: 'skipped',
            reason: `OCR failed: ${ocrResult.rawResponse.error}`,
          });
          failedCount++;
          continue;
        }

        // Find matching journey using sophisticated matching logic
        // Pass the full ocrResult so findMatchingJourney can check all possible field locations
        const matchedJourney = findMatchingJourney(ocrResult, allJourneys);

        console.log(`🔍 Matching result for ${file.name}:`, {
          matchedJourney: matchedJourney ? matchedJourney.id : null,
          journeyNumber: ocrResult.journeyNumber,
          loadId: ocrResult.loadId,
          invoiceDetailsLrNo: ocrResult.invoiceDetails?.lrNo,
        });

        // Determine match status
        const isMatched = !!matchedJourney;
        const needsReview = !isMatched && (ocrResult.journeyNumber || ocrResult.loadId || ocrResult.invoiceDetails?.lrNo || ocrResult.invoiceDetails?.lcuNo);
        
        console.log(`📊 Match status for ${file.name}:`, {
          isMatched,
          needsReview,
          hasJourneyNumber: !!ocrResult.journeyNumber,
          hasLoadId: !!ocrResult.loadId,
        });

        // Prepare OCR extracted data for storage (match local server structure)
        const ocrExtractedData: any = {
          journeyNumber: ocrResult.journeyNumber,
          vehicleNumber: ocrResult.vehicleNumber,
          loadId: ocrResult.loadId,
          confidence: ocrResult.confidence,
          rawResponse: ocrResult.rawResponse,
          // Store full nested structures (matching local server)
          invoiceDetails: ocrResult.invoiceDetails || null,
          chargeBreakup: ocrResult.chargeBreakup || null,
          materialDetails: ocrResult.materialDetails || null,
          // Also store top-level fields for backward compatibility
          invoiceNumber: ocrResult.invoiceNumber,
          baseFreight: ocrResult.baseFreight,
          totalAmount: ocrResult.totalAmount,
          charges: ocrResult.charges || [],
        };

        // Determine match status (must match enum: 'pending_review', 'matched', 'mismatch', 'accepted', 'rejected', 'skipped')
        let matchStatus: 'pending_review' | 'matched' | 'mismatch' | 'skipped';
        if (isMatched) {
          matchStatus = 'matched';
        } else if (needsReview) {
          matchStatus = 'mismatch'; // 'needs_review' is not in enum, use 'mismatch'
        } else {
          matchStatus = 'skipped';
        }

        // Prepare match_details JSONB
        const matchDetails = {
          isMatched,
          matchScore: isMatched ? 100 : needsReview ? 50 : 0,
          matchReason: isMatched 
            ? `LR Number matched: ${ocrResult.journeyNumber} = ${matchedJourney?.journey_number}`
            : needsReview 
              ? 'Needs review - LR Number found but no match'
              : 'No LR Number found in OCR',
          matchDetails: isMatched ? [`LR Number matched: ${ocrResult.journeyNumber}`] : [],
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

        console.log(`📝 Inserting bulk_job_item for ${file.name}:`, {
          bulk_job_id: bulkJob.id,
          file_name: file.name,
          storage_path: fullStoragePath,
          journey_id: matchedJourney?.id || null,
          match_status: matchStatus,
          has_ocr_data: !!ocrExtractedData,
        });

        const { data: jobItem, error: itemError } = await supabase
          .from('bulk_job_items')
          .insert({
            bulk_job_id: bulkJob.id,
            file_name: file.name,
            storage_path: fullStoragePath, // Use storage_path, not file_url
            journey_id: matchedJourney?.id || null,
            ocr_extracted_data: ocrExtractedData,
            ocr_confidence: ocrResult.confidence || null,
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

        console.log(`✅ Created job item for ${file.name}:`, jobItem?.id);

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
    });
    
    // Ensure failedCount accounts for any uncounted files (shouldn't happen, but safety check)
    const finalFailedCount = failedCount + Math.max(0, files.length - totalCounted);
    
    await supabase
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
