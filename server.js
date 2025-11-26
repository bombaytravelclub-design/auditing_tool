// Express Server - Alternative to Vercel Dev
// Run with: node server.js

const express = require('express');
const cors = require('cors');
const formidable = require('formidable');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import API handlers
// Note: You'll need to adapt the Vercel handlers to work with Express

// Example: Proformas endpoint
app.get('/api/proformas', async (req, res) => {
  try {
    // Import and call your existing logic
    const { supabase } = require('./api/_lib/supabase');
    
    const { category, epodStatus, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('proformas')
      .select(`
        *,
        journey:journeys(*),
        invoice_document:invoice_documents(*)
      `, { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (epodStatus) query = query.eq('journey.epod_status', epodStatus);

    query = query
      .range(offset, offset + limitNum - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch proformas', details: error.message });
    }

    res.json({
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// TODO: Add other endpoints here
// app.post('/api/pod/bulk-upload', async (req, res) => { ... });
// app.post('/api/invoice/bulk-upload', async (req, res) => { ... });
// etc.

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`✅ Test: http://localhost:${PORT}/api/proformas`);
});

