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
      // Fetch bulk job first
      const { data: job, error: jobError } = await supabase
        .from('bulk_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        console.error('❌ Job not found:', jobError);
        return res.status(404).json({ error: 'Bulk job not found' });
      }

      // Fetch items separately (more reliable than nested query)
      const { data: items, error: itemsError } = await supabase
        .from('bulk_job_items')
        .select('*')
        .eq('bulk_job_id', jobId)
        .order('created_at', { ascending: false });

      // SUMMARY_API_DEBUG - Comprehensive debug logging
      console.log('SUMMARY_API_DEBUG', {
        env: process.env.VERCEL ? 'vercel' : 'local',
        jobId: jobId,
        itemCount: items?.length ?? 0,
        firstItem: items?.[0] ? {
          id: items[0].id,
          file_name: items[0].file_name,
          match_status: items[0].match_status,
          journey_id: items[0].journey_id,
          bulk_job_id: items[0].bulk_job_id,
          has_ocr_data: !!items[0].ocr_extracted_data,
        } : null,
        allItems: items?.map(item => ({
          id: item.id,
          file_name: item.file_name,
          match_status: item.match_status,
        })) || [],
        error: itemsError,
      });

      if (itemsError) {
        console.error('❌ Error fetching items:', itemsError);
        console.error('   Error code:', itemsError.code);
        console.error('   Error message:', itemsError.message);
        console.error('   Error details:', itemsError.details);
      }

      console.log(`📊 Found ${items?.length || 0} items for job ${jobId}`);
      
      // Debug: Log raw items
      if (items && items.length > 0) {
        console.log('📋 Raw items from database:');
        items.forEach((item, idx) => {
          console.log(`  Item ${idx + 1}:`, {
            id: item.id,
            file_name: item.file_name,
            match_status: item.match_status,
            journey_id: item.journey_id,
            bulk_job_id: item.bulk_job_id,
            has_ocr_data: !!item.ocr_extracted_data,
          });
        });
      } else {
        console.log('⚠️ No items found in database for this job!');
        console.log('   Job ID:', jobId);
        console.log('   This could mean:');
        console.log('   1. Items were not created during bulk upload');
        console.log('   2. Items were deleted');
        console.log('   3. Job ID mismatch');
      }

      // Transform data for frontend - ALWAYS return items, even if skipped
      const transformedItems = await Promise.all((items || []).map(async (item: any) => {
        try {
          // Parse OCR data if it's a string
          let ocrData = item.ocr_extracted_data || {};
          if (typeof ocrData === 'string') {
            try {
              ocrData = JSON.parse(ocrData);
            } catch (e) {
              console.error('Failed to parse OCR data:', e);
              ocrData = {};
            }
          }

          // Get journey if exists
          let journey = null;
          let transporterName = 'Unknown';
          let proforma = null;

          if (item.journey_id) {
            const { data: journeyData } = await supabase
              .from('journeys')
              .select('id, journey_number, load_id, vehicle_number, origin, destination, transporter_id, epod_status')
              .eq('id', item.journey_id)
              .single();
            
            journey = journeyData;

            // Get transporter name
            if (journey?.transporter_id) {
              const { data: transporter } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', journey.transporter_id)
                .single();
              transporterName = transporter?.full_name || 'Unknown';
            }

            // Get proforma
            const { data: proformaData } = await supabase
              .from('proformas')
              .select('base_freight, toll_charge, unloading_charge, detention_charge, other_charges, gst_amount, total_amount')
              .eq('journey_id', journey.id)
              .limit(1)
              .single();
            proforma = proformaData;
          }

          // Calculate contracted charges
          const contractedCharges = proforma ? [
            { id: 'base', type: 'Base Freight', contracted: proforma.base_freight || 0, invoice: ocrData.baseFreight || ocrData.chargeBreakup?.baseFreight || 0, variance: (ocrData.baseFreight || ocrData.chargeBreakup?.baseFreight || 0) - (proforma.base_freight || 0) },
            { id: 'toll', type: 'Toll Charges', contracted: proforma.toll_charge || 0, invoice: ocrData.chargeBreakup?.tollCharges || ocrData.charges?.find((c: any) => c.type === 'Toll Charges')?.amount || 0, variance: (ocrData.chargeBreakup?.tollCharges || ocrData.charges?.find((c: any) => c.type === 'Toll Charges')?.amount || 0) - (proforma.toll_charge || 0) },
            { id: 'unload', type: 'Unloading Charges', contracted: proforma.unloading_charge || 0, invoice: ocrData.chargeBreakup?.unloadingCharges || ocrData.charges?.find((c: any) => c.type === 'Unloading Charges')?.amount || 0, variance: (ocrData.chargeBreakup?.unloadingCharges || ocrData.charges?.find((c: any) => c.type === 'Unloading Charges')?.amount || 0) - (proforma.unloading_charge || 0) },
          ] : [];

          // Calculate totals
          const contractedTotal = proforma?.total_amount || 0;
          const invoiceTotal = ocrData.totalAmount || ocrData.chargeBreakup?.totalPayableAmount || null;

          // Extract data from static invoice structure or OCR structure
          // For skipped items, use file name or default values
          const loadId = journey?.load_id || ocrData.loadId || ocrData.lcuNumber || (item.file_name || 'Unknown');
          const journeyNo = journey?.journey_number || ocrData.journeyNumber || ocrData.lrNumber || (item.file_name || 'Unknown');
          const vehicle = journey?.vehicle_number || ocrData.vehicleNumber || 'Unknown';
          const consignee = journey?.destination || ocrData.destination || 'Unknown';
          
          return {
            id: item.id,
            loadId: loadId,
            journeyNo: journeyNo,
            vehicle: vehicle,
            consignee: consignee,
            transporter: transporterName,
            document: item.file_name || 'Unknown',
            documentUrl: ocrData.fileUrl || item.storage_path || null,
            file_name: item.file_name || 'Unknown',
            journey_id: item.journey_id,
            match_status: item.match_status || 'skipped',
            matchStatus: item.match_status || 'skipped',
            autoApproval: item.match_status === 'matched' ? 'Passed' : (item.match_status === 'mismatch' ? 'Failed' : 'Pending'),
            matchScore: item.match_details?.matchScore || 0,
            matchReason: item.match_details?.matchReason || item.error_message || 'No match found',
            status: item.match_status || 'pending_review',
            error_message: item.error_message,
            reason: item.error_message || item.match_details?.matchReason || 'No match found',
            epod_status: journey?.epod_status || null,
            ocrData: {
              ...ocrData,
              invoiceDetails: ocrData.invoiceDetails,
              chargeBreakup: ocrData.chargeBreakup,
              materialDetails: ocrData.materialDetails,
              error: ocrData.error,
              rawResponse: ocrData.rawResponse,
              // Include static data fields
              invoiceNumber: ocrData.invoiceNumber,
              lrNumber: ocrData.lrNumber,
              lcuNumber: ocrData.lcuNumber,
              origin: ocrData.origin,
              destination: ocrData.destination,
            },
            contractedCost: contractedTotal || null,
            invoiceAmount: invoiceTotal,
            variance: contractedTotal && invoiceTotal !== null ? (invoiceTotal - contractedTotal) : null,
            charges: contractedCharges,
          };
        } catch (error: any) {
          // If transformation fails, return a minimal item structure
          console.error(`Error transforming item ${item.id}:`, error);
          return {
            id: item.id,
            loadId: item.file_name || 'Unknown',
            journeyNo: item.file_name || 'Unknown',
            vehicle: 'Unknown',
            consignee: 'Unknown',
            transporter: 'Unknown',
            document: item.file_name || 'Unknown',
            documentUrl: item.storage_path || null,
            file_name: item.file_name || 'Unknown',
            journey_id: item.journey_id,
            match_status: item.match_status || 'skipped',
            matchStatus: item.match_status || 'skipped',
            autoApproval: 'Pending',
            matchScore: 0,
            matchReason: item.error_message || 'Error processing item',
            status: item.match_status || 'pending_review',
            error_message: item.error_message,
            reason: item.error_message || 'Error processing item',
            epod_status: null,
            ocrData: {},
            contractedCost: null,
            invoiceAmount: null,
            variance: null,
            charges: [],
          };
        }
      }));

      console.log(`✅ Returning ${transformedItems.length} transformed items`);
      
      // Ensure items array is always present (even if empty)
      const response = {
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
        items: transformedItems || [], // Ensure items is always an array
      };

      console.log('SUMMARY_API_RESPONSE', {
        jobId: jobId,
        itemsCount: response.items.length,
        firstItemMatchStatus: response.items[0]?.match_status || null,
        firstItemJourneyId: response.items[0]?.journey_id || null,
      });

      return res.status(200).json(response);

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


