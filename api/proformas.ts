// GET /api/proformas
// Returns proforma listing with filters

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase';
import type { ProformaListResponse, ProformaFilters } from '../src/types/domain';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables early
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables:');
    console.error('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Missing Supabase environment variables. Please check Vercel environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    });
  }

  try {
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

    // Build query with user details - proper nested join
    let query = supabase
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
      const { data: journeysData, error: journeysError } = await supabase
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
      console.error('Proforma query error:', error);
      return res.status(500).json({
        error: 'Failed to fetch proformas',
        details: error.message,
      });
    }

    // Format response
    const response: ProformaListResponse = {
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Proformas API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

