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

    // If filtering by epodStatus, we need to join with journeys
    if (epodStatus) {
      query = query
        .not('journey_id', 'is', null)
        .eq('journey.epod_status', epodStatus);
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

