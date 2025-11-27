// Get Bulk Job Details API
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Missing jobId parameter' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch bulk job with related items
      const { data: job, error: jobError } = await supabase
        .from('bulk_jobs')
        .select(`
          *,
          items:bulk_job_items(
            *,
            journey:journeys(
              id,
              journey_number,
              load_id,
              vehicle_number,
              origin,
              destination,
              transporter:transporter_id(full_name),
              proforma:proformas(
                base_freight,
                detention_charge,
                toll_charge,
                unloading_charge,
                other_charges,
                total_amount
              )
            )
          )
        `)
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return res.status(404).json({ error: 'Bulk job not found' });
      }

      // Transform data for frontend
      const transformedItems = job.items?.map((item: any) => {
        const journey = item.journey;
        const proforma = journey?.proforma?.[0];
        const ocrData = item.ocr_extracted_data || {};

        // Calculate contracted charges
        const contractedCharges = proforma ? [
          { id: 'base', type: 'Base Freight', contracted: proforma.base_freight, invoice: proforma.base_freight, variance: 0 },
          { id: 'toll', type: 'Toll Charges', contracted: proforma.toll_charge, invoice: proforma.toll_charge, variance: 0 },
          { id: 'unload', type: 'Unloading Charges', contracted: proforma.unloading_charge, invoice: proforma.unloading_charge, variance: 0 },
        ] : [];

        // For demo, we'll show actual variance if OCR extracted invoice amounts
        // In real scenario, OCR would extract invoice charges
        const contractedTotal = proforma?.total_amount || 0;

        return {
          id: item.id,
          loadId: journey?.load_id || 'Unknown',
          journeyNo: journey?.journey_number || 'Unknown',
          vehicle: journey?.vehicle_number || ocrData.vehicleNumber || 'Unknown',
          consignee: journey?.destination || 'Unknown',
          transporter: journey?.transporter?.full_name || 'Unknown',
          document: item.file_name,
          documentUrl: item.file_url,
          autoApproval: item.match_status === 'matched' ? 'Passed' : 'Failed',
          matchScore: item.match_score || 0,
          matchReason: item.match_reason || '',
          status: item.status,
          ocrData: {
            vehicleNumber: ocrData.vehicleNumber,
            loadId: ocrData.loadId,
            journeyNumber: ocrData.journeyNumber,
            confidence: ocrData.confidence,
          },
          contractedCost: contractedTotal,
          invoiceAmount: contractedTotal, // TODO: Extract from invoice PDF
          variance: 0, // TODO: Calculate from extracted invoice data
          charges: contractedCharges,
        };
      }) || [];

      return res.status(200).json({
        success: true,
        job: {
          id: job.id,
          type: job.job_type,
          status: job.status,
          totalFiles: job.total_files,
          matched: job.matched_files || 0,
          needsReview: job.mismatch_files || 0,
          skipped: job.failed_files || 0,
          createdAt: job.created_at,
        },
        items: transformedItems,
      });

    } catch (error: any) {
      console.error('Error fetching bulk job:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }

  } else if (req.method === 'POST') {
    // Handle review actions
    try {
      const { itemId, chargeActions, overallDecision, comments } = req.body;

      if (!itemId) {
        return res.status(400).json({ error: 'Missing itemId' });
      }

      // Save review actions to database
      const reviewData = {
        bulk_job_item_id: itemId,
        action: overallDecision || 'pending',
        charge_decisions: chargeActions || {},
        comments: comments || '',
        reviewed_by: 'mock-consignor-id', // TODO: Replace with actual user ID
      };

      const { data: reviewAction, error: reviewError } = await supabase
        .from('review_actions')
        .insert(reviewData)
        .select()
        .single();

      if (reviewError) {
        console.error('Error saving review action:', reviewError);
        return res.status(500).json({ error: 'Failed to save review action' });
      }

      // Update bulk job item status
      await supabase
        .from('bulk_job_items')
        .update({
          status: overallDecision === 'accepted' ? 'approved' : overallDecision === 'rejected' ? 'rejected' : 'pending_review',
        })
        .eq('id', itemId);

      return res.status(200).json({
        success: true,
        reviewAction,
      });

    } catch (error: any) {
      console.error('Error saving review:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}


