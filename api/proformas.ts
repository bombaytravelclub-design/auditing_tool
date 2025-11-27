// GET /api/proformas
// Returns proforma listing with filters

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly in the handler to avoid module load issues
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Define types inline to avoid import issues
interface ProformaListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase client
    let supabaseClient;
    try {
      supabaseClient = getSupabaseClient();
    } catch (error: any) {
      console.error('❌ Failed to initialize Supabase:', error);
      return res.status(500).json({
        error: 'Server configuration error',
        details: error.message || 'Failed to initialize Supabase client',
      });
    }

    // Parse query parameters
    const {
      category,
      epodStatus,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    console.log('📊 Fetching proformas with params:', { category, epodStatus, page: pageNum, limit: limitNum });

    // Build query with user details - proper nested join
    let query = supabaseClient
      .from('proformas')
      .select(`
        *,
        journey:journeys(
          *,
          transporter:users!transporter_id(id, full_name, email),
          consignor:users!consignor_id(id, full_name, email)
        ),
        invoice_document:invoice_documents(*)
      `, { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    // Handle epodStatus filter - Supabase doesn't support nested filters directly
    // So we need to fetch journey IDs first, then filter proformas
    let journeyIdsForEpodFilter = null;
    if (epodStatus) {
      console.log(`🔍 Filtering by epodStatus: ${epodStatus}`);
      const { data: journeysData, error: journeysError } = await supabaseClient
        .from('journeys')
        .select('id')
        .eq('epod_status', epodStatus);
      
      if (journeysError) {
        console.error('❌ Error fetching journeys for epodStatus filter:', journeysError);
        return res.status(500).json({
          error: 'Failed to filter by epodStatus',
          details: journeysError.message,
        });
      }
      
      journeyIdsForEpodFilter = (journeysData || []).map(j => j.id);
      console.log(`✅ Found ${journeyIdsForEpodFilter.length} journeys with epodStatus=${epodStatus}`);
      
      if (journeyIdsForEpodFilter.length === 0) {
        // No journeys match, return empty result
        return res.json({
          data: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
        });
      }
      
      // Filter proformas by journey IDs
      query = query.in('journey_id', journeyIdsForEpodFilter);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limitNum - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Proforma query error:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);
      return res.status(500).json({
        error: 'Failed to fetch proformas',
        details: error.message,
        code: error.code,
      });
    }

    console.log(`✅ Found ${count || 0} proformas, returning ${data?.length || 0} items`);

    // Format response
    const response: ProformaListResponse = {
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Proformas API error:', error);
    console.error('   Error type:', typeof error);
    console.error('   Error message:', error?.message);
    console.error('   Error stack:', error?.stack);
    return res.status(500).json({
      error: 'Internal server error',
      details: error?.message || String(error),
      type: typeof error,
    });
  }
}

