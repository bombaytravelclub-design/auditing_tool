#!/usr/bin/env node
/**
 * Local Express Server for Freight Audit Backend
 * Run locally without Vercel CLI
 * Deploy to Vercel later using /api folder (no changes needed!)
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ============================================================================
// Import Supabase client (inline to avoid TypeScript issues)
// ============================================================================
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

console.log('✅ Supabase client initialized');
console.log(`   URL: ${process.env.SUPABASE_URL ? '✓' : '✗'}`);
console.log(`   Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗'}`);

// ============================================================================
// API ROUTES
// ============================================================================

// GET /api/proformas
app.get('/api/proformas', async (req, res) => {
  try {
    console.log('📊 Fetching proformas...');
    
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Supabase not configured',
        details: 'Check your environment variables'
      });
    }

    const {
      category,
      epodStatus,
      page = '1',
      limit = '50',
    } = req.query;

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

    if (category) {
      query = query.eq('category', category);
    }

    if (epodStatus) {
      query = query
        .not('journey_id', 'is', null)
        .eq('journey.epod_status', epodStatus);
    }

    query = query
      .range(offset, offset + limitNum - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Proforma query error:', error);
      return res.status(500).json({
        error: 'Failed to fetch proformas',
        details: error.message,
      });
    }

    console.log(`✅ Found ${count || 0} proformas`);
    
    res.json({
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('❌ Error in /api/proformas:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

// POST /api/pod/bulk-upload (TODO: Implement)
app.post('/api/pod/bulk-upload', async (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'This endpoint is ready to implement. See QUICK_START_BACKEND.md for template.'
  });
});

// POST /api/invoice/bulk-upload (TODO: Implement)
app.post('/api/invoice/bulk-upload', async (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'This endpoint is ready to implement. See QUICK_START_BACKEND.md for template.'
  });
});

// GET /api/bulk-jobs/:jobId (TODO: Implement)
app.get('/api/bulk-jobs/:jobId', async (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'This endpoint is ready to implement. See QUICK_START_BACKEND.md for template.'
  });
});

// GET /api/bulk-jobs/:jobId/items/:itemId (TODO: Implement)
app.get('/api/bulk-jobs/:jobId/items/:itemId', async (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'This endpoint is ready to implement. See QUICK_START_BACKEND.md for template.'
  });
});

// POST /api/review-actions (TODO: Implement)
app.post('/api/review-actions', async (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented yet',
    message: 'This endpoint is ready to implement. See QUICK_START_BACKEND.md for template.'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: {
      supabase: !!process.env.SUPABASE_URL,
      openai: !!process.env.OPENAI_API_KEY,
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🚀 FREIGHT AUDIT BACKEND - RUNNING LOCALLY 🚀        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server:    http://localhost:${PORT}`);
  console.log(`✅ Health:    http://localhost:${PORT}/health`);
  console.log(`✅ API:       http://localhost:${PORT}/api/proformas`);
  console.log('');
  console.log('📊 Available Endpoints:');
  console.log('  GET  /api/proformas ✅');
  console.log('  POST /api/pod/bulk-upload 🚧');
  console.log('  POST /api/invoice/bulk-upload 🚧');
  console.log('  GET  /api/bulk-jobs/:jobId 🚧');
  console.log('  GET  /api/bulk-jobs/:jobId/items/:itemId 🚧');
  console.log('  POST /api/review-actions 🚧');
  console.log('');
  console.log('🎯 Frontend: http://localhost:5174');
  console.log('');
  console.log('Press Ctrl+C to stop\n');
});

