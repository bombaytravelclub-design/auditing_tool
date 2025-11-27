// Bulk Upload API - POD and Invoice Document Processing
import { createClient } from '@supabase/supabase-js';
import { extractPodMetadata } from './_lib/ocr';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        matched_count: 0,
        needs_review_count: 0,
        skipped_count: 0,
        status: 'processing',
        uploaded_by: 'mock-consignor-id', // TODO: Replace with actual user ID from auth
      })
      .select()
      .single();

    if (jobError || !bulkJob) {
      console.error('Error creating bulk job:', jobError);
      return res.status(500).json({ error: 'Failed to create bulk job' });
    }

    // Fetch selected journeys for matching
    const { data: journeys, error: journeysError } = await supabase
      .from('journeys')
      .select('id, journey_number, load_id, vehicle_number')
      .in('id', journeyIds);

    if (journeysError) {
      console.error('Error fetching journeys:', journeysError);
      return res.status(500).json({ error: 'Failed to fetch journeys' });
    }

    const processedItems = [];
    let matchedCount = 0;
    let needsReviewCount = 0;

    // Process each file
    for (const file of files) {
      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(file.data, 'base64');
        
        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`pod/${fileName}`, fileBuffer, {
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
          .getPublicUrl(`pod/${fileName}`);

        // Extract metadata using OCR
        const ocrResult = await extractPodMetadata(fileBuffer, file.type);

        // Find best matching journey
        let matchedJourney = null;
        let matchScore = 0;
        let matchReason = '';

        for (const journey of journeys || []) {
          let score = 0;
          const reasons = [];

          if (ocrResult.loadId && journey.load_id.includes(ocrResult.loadId)) {
            score += 50;
            reasons.push('Load ID match');
          }

          if (ocrResult.vehicleNumber && journey.vehicle_number === ocrResult.vehicleNumber) {
            score += 30;
            reasons.push('Vehicle match');
          }

          if (ocrResult.journeyNumber && journey.journey_number.includes(ocrResult.journeyNumber)) {
            score += 20;
            reasons.push('Journey# match');
          }

          if (score > matchScore) {
            matchScore = score;
            matchedJourney = journey;
            matchReason = reasons.join(', ');
          }
        }

        // Determine match status
        const isMatched = matchScore >= 50;
        const needsReview = matchScore > 0 && matchScore < 50;

        if (isMatched) matchedCount++;
        if (needsReview) needsReviewCount++;

        // Insert into bulk_job_items
        const { data: jobItem, error: itemError } = await supabase
          .from('bulk_job_items')
          .insert({
            bulk_job_id: bulkJob.id,
            file_name: file.name,
            file_url: urlData?.publicUrl,
            journey_id: matchedJourney?.id,
            ocr_extracted_data: {
              vehicleNumber: ocrResult.vehicleNumber,
              loadId: ocrResult.loadId,
              journeyNumber: ocrResult.journeyNumber,
              confidence: ocrResult.confidence,
            },
            match_status: isMatched ? 'matched' : needsReview ? 'needs_review' : 'skipped',
            match_score: matchScore,
            match_reason: matchReason,
            status: 'pending_review',
          })
          .select()
          .single();

        if (itemError) {
          console.error('Error creating job item:', itemError);
        }

        processedItems.push({
          fileName: file.name,
          status: isMatched ? 'matched' : needsReview ? 'needs_review' : 'skipped',
          matchedJourneyId: matchedJourney?.id,
          matchScore,
          ocrData: {
            vehicleNumber: ocrResult.vehicleNumber,
            loadId: ocrResult.loadId,
            journeyNumber: ocrResult.journeyNumber,
            confidence: ocrResult.confidence,
          },
        });

        // Update POD document record
        if (matchedJourney && isMatched) {
          await supabase
            .from('pod_documents')
            .insert({
              journey_id: matchedJourney.id,
              file_name: file.name,
              file_url: urlData?.publicUrl,
              uploaded_by: 'mock-consignor-id',
              ocr_metadata: {
                vehicleNumber: ocrResult.vehicleNumber,
                loadId: ocrResult.loadId,
                journeyNumber: ocrResult.journeyNumber,
                confidence: ocrResult.confidence,
              },
            });
        }

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
        matched_count: matchedCount,
        needs_review_count: needsReviewCount,
        skipped_count: files.length - matchedCount - needsReviewCount,
        status: 'completed',
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


