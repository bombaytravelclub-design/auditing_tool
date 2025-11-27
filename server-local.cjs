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
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
        journey:journeys(
          *,
          transporter:users!transporter_id(id, full_name, email),
          consignor:users!consignor_id(id, full_name, email)
        ),
        invoice_document:invoice_documents(*)
      `, { count: 'exact' });

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

// POST /api/bulk-upload (Universal endpoint)
app.post('/api/bulk-upload', async (req, res) => {
  try {
    console.log('📤 Bulk upload request received');
    const { type, journeyIds, files } = req.body;

    // ============================================================================
    // DEBUG STEP 5: Environment/Tenant Check
    // ============================================================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DEBUG STEP 5: Environment/Tenant Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📤 Bulk upload request received:`);
    console.log(`   Type: ${type}`);
    console.log(`   Journey IDs from Frontend:`, JSON.stringify(journeyIds, null, 2));
    console.log(`   Journey IDs count: ${journeyIds?.length || 0}`);
    console.log(`   Files count: ${files?.length || 0}`);
    console.log(`   Environment check:`, {
      supabaseUrl: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      openaiKey: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (!type || !journeyIds || !Array.isArray(journeyIds) || journeyIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: type, journeyIds' });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    console.log(`📋 Processing ${files.length} files for ${journeyIds.length} journeys`);

    // Get first user ID for now (in production, this would come from auth)
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : null;

    // Create bulk job record
    const { data: bulkJob, error: jobError} = await supabase
      .from('bulk_jobs')
      .insert({
        job_type: type.toLowerCase(),
        total_files: files.length,
        processed_files: 0,
        matched_files: 0,
        mismatch_files: 0,
        failed_files: 0,
        status: 'processing',
        uploaded_by: userId,
      })
      .select()
      .single();

    if (jobError || !bulkJob) {
      console.error('❌ Error creating bulk job:', jobError);
      return res.status(500).json({ error: 'Failed to create bulk job' });
    }

    console.log(`✅ Created bulk job: ${bulkJob.id}`);

    // ============================================================================
    // STEP 1: Fetch journeys by UUID (always fetch ALL journeys, regardless of type)
    // ============================================================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 STEP 1: Fetching Journeys');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Journey IDs received from frontend:`, JSON.stringify(journeyIds, null, 2));
    console.log(`Journey IDs count: ${journeyIds?.length || 0}`);
    console.log(`Journey IDs types:`, journeyIds?.map(id => ({ id, type: typeof id, isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) })));
    
    // Fetch journeys - use journey_number (which IS the LR Number) and load_id for matching
    // Filter out any invalid UUIDs first
    const validJourneyIds = (journeyIds || []).filter(id => {
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    });
    
    console.log(`📋 Validating journey IDs:`);
    console.log(`   Total received: ${journeyIds?.length || 0}`);
    console.log(`   Valid UUIDs: ${validJourneyIds.length}`);
    console.log(`   Invalid IDs: ${(journeyIds || []).length - validJourneyIds.length}`);
    
    if (validJourneyIds.length === 0) {
      console.error('❌ No valid journey UUIDs provided!');
      console.error(`   Received journeyIds:`, JSON.stringify(journeyIds, null, 2));
      return res.status(400).json({ 
        error: 'No valid journey IDs provided', 
        details: 'Journey IDs must be valid UUIDs. Received: ' + JSON.stringify(journeyIds),
        receivedIds: journeyIds
      });
    }
    
    // IMPORTANT: Fetch ALL journeys from database for matching, not just selected ones
    // This allows OCR to match any journey by LR number, even if user didn't select it
    // We still validate selected journeyIds, but match against all journeys
    console.log(`🔍 Fetching ALL journeys from database for matching (not just selected ones)...`);
    
    // Note: journey_number IS the LR Number in this system (lr_number column doesn't exist)
    const { data: journeysData, error: journeysError } = await supabase
      .from('journeys')
      .select('id, journey_number, load_id, vehicle_number, epod_status');
    
    if (journeysError) {
      console.error('❌ Error fetching journeys:', JSON.stringify(journeysError, null, 2));
      console.error('   Error code:', journeysError.code);
      console.error('   Error message:', journeysError.message);
      console.error('   Error details:', journeysError.details);
      console.error('   Error hint:', journeysError.hint);
      return res.status(500).json({ 
        error: 'Failed to fetch journeys', 
        details: journeysError.message,
        code: journeysError.code
      });
    }
    
    const journeys = journeysData || [];
    console.log(`✅ Fetched ${journeys.length} journeys from database (ALL journeys, not just selected)`);
    
    // Log available LR numbers for debugging
    const availableLRs = journeys.map(j => j.journey_number).filter(Boolean);
    console.log(`📋 Available LR numbers in database: ${availableLRs.length} total`);
    if (availableLRs.length > 0) {
      console.log(`   Sample LR numbers:`, availableLRs.slice(0, 20));
    }
    
    // CRITICAL: Ensure journeys is accessible in file processing loop
    // Store in a way that's guaranteed to be accessible
    if (!journeys || journeys.length === 0) {
      console.error(`❌ CRITICAL: No journeys fetched! Matching will fail!`);
      return res.status(500).json({ 
        error: 'No journeys available in database', 
        details: 'Cannot perform matching without journeys'
      });
    }
    
    if (journeys.length > 0) {
      console.log(`   Sample journeys (first 5):`);
      journeys.slice(0, 5).forEach((j, idx) => {
        console.log(`   Journey ${idx + 1}:`, {
          id: j.id,
          journey_number: j.journey_number, // This IS the LR Number
          load_id: j.load_id, // This IS the LCU Number
          vehicle_number: j.vehicle_number
        });
      });
    } else {
      console.error(`❌ CRITICAL: No journeys found in database!`);
      console.error(`   This means matching will fail for all files!`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // ============================================================================
    // STEP 2: Fetch proformas for all journeys (for invoice type)
    // ============================================================================
    let proformaByJourneyId = new Map();
    if (type.toLowerCase() === 'invoice' && journeys.length > 0) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 STEP 2: Fetching Proformas');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const journeyIdsForProforma = journeys.map(j => j.id);
      console.log(`Fetching proformas for ${journeyIdsForProforma.length} journeys`);
      
      // Fetch ALL proformas (not just for selected journeys) so we can match any journey
      const { data: proformasData, error: proformasError } = await supabase
        .from('proformas')
        .select('id, journey_id, base_freight, toll_charge, unloading_charge, detention_charge, other_charges, gst_amount, total_amount');
      
      if (proformasError) {
        console.error('⚠️ Error fetching proformas:', proformasError);
      } else {
        const proformas = proformasData || [];
        console.log(`✅ Fetched ${proformas.length} proformas`);
        proformas.forEach((p, idx) => {
          console.log(`   Proforma ${idx + 1}:`, {
            id: p.id,
            journey_id: p.journey_id,
            total_amount: p.total_amount
          });
          proformaByJourneyId.set(p.journey_id, p);
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    }

    console.log(`📊 Loaded ${journeys?.length || 0} journeys for matching`);
    
    // ============================================================================
    // DEBUG STEP 1: Sanity Check - Are we loading the right journeys?
    // ============================================================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DEBUG STEP 1: Journey Loading Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Journey IDs from Frontend:`, JSON.stringify(journeyIds, null, 2));
    console.log(`Journeys loaded count: ${journeys?.length || 0}`);
    
    if (journeys && journeys.length > 0) {
      console.log(`✅ Journeys fetched for job (bulk job will be created):`);
      journeys.forEach((j, idx) => {
        console.log(`  Journey ${idx + 1}:`, {
          id: j.id,
          journey_number: j.journey_number,
          vehicle_number: j.vehicle_number,
          load_id: j.load_id,
          // Check if proforma exists (for invoices)
          hasProforma: type.toLowerCase() === 'invoice' ? (j.proformas && j.proformas.length > 0) : 'N/A',
          proformaId: type.toLowerCase() === 'invoice' && j.proformas && j.proformas.length > 0 ? j.proformas[0].id : null
  });
});

      // Extract all LR numbers from loaded journeys
      const journeyLRNumbers = journeys.map(j => ({
        id: j.id,
        journey_number: j.journey_number,
        vehicle_number: j.vehicle_number,
        load_id: j.load_id
      }));
      console.log(`📋 All journey_number values available for matching:`, journeyLRNumbers.map(j => j.journey_number));
    } else {
      console.error(`❌ CRITICAL: No journeys loaded for matching!`);
      console.error(`   Journey IDs provided: ${JSON.stringify(journeyIds)}`);
      console.error(`   This means ALL files will show "no match" regardless of OCR!`);
      console.error(`   Possible causes:`);
      console.error(`   1. Journey IDs don't exist in database`);
      console.error(`   2. For invoices: Journeys don't have proformas (check join)`);
      console.error(`   3. Environment/tenant mismatch`);
      console.error(`   4. Journey IDs are from wrong table/environment`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const processedItems = [];
    let matchedCount = 0;
    let needsReviewCount = 0;
    let failedCount = 0;

    // ============================================================================
    // CRITICAL DEBUG: Verify file loop will execute
    // ============================================================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 CRITICAL: File Processing Loop Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total files received in API: ${files.length}`);
    console.log(`Files array:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    console.log(`Loop type: for loop with await (correct)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Process each file - USING FOR LOOP WITH AWAIT (not forEach!)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 PROCESSING FILE ${i + 1}/${files.length}: ${file.name}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        console.log(`🔍 Processing file ${i + 1}/${files.length}: ${file.name}`);
        
        const fileBuffer = Buffer.from(file.data, 'base64');
        // Sanitize filename for Supabase Storage (remove spaces, special chars)
        const sanitizedFileName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
          .replace(/\s+/g, '_') // Replace spaces with underscore
          .substring(0, 255); // Limit length
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const storagePath = type.toLowerCase() === 'invoice' ? `invoice/${fileName}` : `pod/${fileName}`;
        
        console.log(`📤 Uploading to storage: ${storagePath}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error(`❌ Upload error:`, uploadError);
          console.error(`   Original filename: ${file.name}`);
          console.error(`   Sanitized filename: ${sanitizedFileName}`);
          console.error(`   Storage path: ${storagePath}`);
          // Still try to process OCR even if upload fails (use file buffer directly)
          console.log(`⚠️ Storage upload failed, but continuing with OCR processing...`);
        }

        const { data: urlData } = uploadData 
          ? supabase.storage.from('documents').getPublicUrl(storagePath)
          : { publicUrl: null };

        // Real OCR extraction using OpenAI
        console.log(`🔍 Running OCR on ${file.name}...`);
        let ocrResult;
        let matchedJourney = null;
        let matchScore = 0;
        let isMatched = false;
        let matchDetails = [];
        let ocrError = null; // Initialize ocrError variable

        try {
          // Use OpenAI for OCR (CommonJS compatible)
          const OpenAI = require('openai');
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });

          // Prepare OCR prompt based on document type
          // PRIORITY: Extract LR Number (journeyNumber) - it's the unique key for matching
          let ocrPrompt;
          if (type.toLowerCase() === 'invoice') {
            ocrPrompt = `Extract the following information and return it as a JSON object:

Invoice Details:

- Transporter name

- Consignor name  

- Invoice No (look for "Invoice No" or "Invoice Number")

- Invoice Date (format as YYYY-MM-DD)

- LR No (look for "LR No" or "LR Number" - this is very important)

- LCU No

- Origin (city and state)

- Destination (city and state)

Charge Breakup:

- Base Freight (as number, no commas)

- Toll Charges (as number)

- Unloading Charges (as number)

- Other Add-on Charges (as number)

- Subtotal Before Tax (as number)

- SGST (as number)

- CGST (as number)

- Total Payable Amount (as number)

Material Details:

- Description

- Quantity in kg (as number)

- Packages

Return the data in this JSON format:

{
  "invoiceDetails": {
    "transporter": "...",
    "consignor": "...",
    "invoiceNo": "...",
    "invoiceDate": "YYYY-MM-DD",
    "lrNo": "...",
    "lcuNo": "...",
    "origin": "...",
    "destination": "..."
  },
  "chargeBreakup": {
    "baseFreight": 0,
    "tollCharges": 0,
    "unloadingCharges": 0,
    "otherAddOnCharges": 0,
    "subtotalBeforeTax": 0,
    "sgst": 0,
    "cgst": 0,
    "totalPayableAmount": 0
  },
  "materialDetails": {
    "description": "...",
    "quantityKg": 0,
    "packages": "..."
  }
}`;
          } else {
            // POD prompt - LR Number is critical
            ocrPrompt = `You are extracting data from a POD (Proof of Delivery) document.

CRITICAL REQUIREMENT: Extract the LR Number (also called Journey Number, Trip ID, LR No, LR Number).
This is the MOST IMPORTANT field. Look for it in headers, tables, or anywhere in the document.
Common formats: LR20257713, LR-20257713, LR 20257713, or just the number 20257713.

Extract ALL fields you can find:
1. LR Number / Journey Number / Trip ID / LR No (MANDATORY - search everywhere)
2. Vehicle number / Registration number
3. Load ID / LCU number
4. Charges (if any)
5. Total amount (if any)

Read only what is printed. Do not invent values. If LR Number is not visible, return null.

Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{
  "journeyNumber": "extracted LR number or null",
  "vehicleNumber": "string or null",
  "loadId": "string or null",
  "charges": [{"type": "string", "amount": number}],
  "totalAmount": number or null,
  "confidence": 0.8
}`;
          }

          // Detect file type from buffer content (more reliable than extension/MIME type)
          // Check buffer magic bytes FIRST to determine actual file type
          const bufferStart = fileBuffer.slice(0, 12);
          const hexStart = bufferStart.toString('hex');
          const textStart = bufferStart.toString('ascii');
          
          console.log(`🔍 File type detection:`);
          console.log(`   File name: ${file.name}`);
          console.log(`   Provided MIME type: ${file.type || 'none'}`);
          console.log(`   Buffer start (hex): ${hexStart.substring(0, 32)}...`);
          console.log(`   Buffer start (text): ${textStart.substring(0, 12)}...`);
          
          let rawMimeType = null;
          let isPdf = false;
          
          // Detect by magic bytes (most reliable - ignores wrong file extensions)
          if (textStart.startsWith('%PDF')) {
            rawMimeType = 'application/pdf';
            isPdf = true;
            console.log(`   ❌ Detected as PDF (starts with %PDF)`);
          } else if (hexStart.startsWith('ffd8')) {
            // JPEG: FF D8 FF
            rawMimeType = 'image/jpeg';
            console.log(`   ✅ Detected as JPEG (FF D8)`);
          } else if (hexStart.startsWith('89504e470d0a1a0a')) {
            // PNG: 89 50 4E 47 0D 0A 1A 0A
            rawMimeType = 'image/png';
            console.log(`   ✅ Detected as PNG (89 50 4E 47)`);
          } else if (hexStart.startsWith('474946')) {
            // GIF: 47 49 46 38 (GIF8)
            rawMimeType = 'image/gif';
            console.log(`   ✅ Detected as GIF (47 49 46)`);
          } else if (hexStart.startsWith('52494646') && bufferStart.slice(8, 12).toString('ascii') === 'WEBP') {
            // WebP: RIFF....WEBP
            rawMimeType = 'image/webp';
            console.log(`   ✅ Detected as WebP (RIFF...WEBP)`);
          } else {
            // Unknown file type - check if provided MIME type is valid
            const providedMimeType = file.type || '';
            if (providedMimeType.startsWith('image/')) {
              rawMimeType = providedMimeType;
              console.log(`   ⚠️ Using provided MIME type: ${rawMimeType}`);
            } else {
              // Last resort: default to PNG but warn
              rawMimeType = 'image/png';
              console.log(`   ⚠️ WARNING: Could not detect file type, defaulting to image/png`);
              console.log(`   ⚠️ This may fail if file is not actually an image!`);
            }
          }
          
          if (isPdf) {
            throw new Error('PDF files are not supported by OpenAI Vision API. Please convert PDF to image (PNG/JPEG) before uploading.');
          }
          
          // Validate that we have a valid image MIME type
          const validImageTypes = {
            'image/png': 'image/png',
            'image/jpeg': 'image/jpeg',
            'image/jpg': 'image/jpeg',
            'image/gif': 'image/gif',
            'image/webp': 'image/webp',
          };
          
          const normalizedMimeType = validImageTypes[rawMimeType?.toLowerCase()];
          
          if (!normalizedMimeType) {
            throw new Error(`Invalid image format detected: ${rawMimeType}. Only PNG, JPEG, GIF, and WebP are supported.`);
          }
          
          console.log(`   Final MIME type: ${normalizedMimeType}`);
          
          // Final validation before creating data URL
          if (!normalizedMimeType || !normalizedMimeType.startsWith('image/')) {
            throw new Error(`Cannot process file: Invalid or unsupported MIME type "${normalizedMimeType}". Only image formats (PNG, JPEG, GIF, WebP) are supported.`);
          }
          
          // Convert buffer to base64 data URL
          const base64File = fileBuffer.toString('base64');
          const imageDataUrl = `data:${normalizedMimeType};base64,${base64File}`;
          
          // Validate data URL format
          if (!imageDataUrl.startsWith(`data:${normalizedMimeType};base64,`)) {
            throw new Error(`Failed to create valid data URL for MIME type: ${normalizedMimeType}`);
          }
          
          // Call OpenAI Vision API (gpt-4o supports vision)
          console.log(`📤 Calling OpenAI API for file: ${file.name}`);
          console.log(`   Detected MIME type: ${rawMimeType}`);
          console.log(`   Normalized MIME type: ${normalizedMimeType}`);
          console.log(`   Base64 length: ${base64File.length}`);
          console.log(`   Data URL prefix: data:${normalizedMimeType};base64,...`);
          
          let completion;
          try {
            completion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "You are an OCR assistant that extracts structured data from freight documents. Return only valid JSON, no markdown or additional text."
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: ocrPrompt
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageDataUrl
                      }
                    }
                  ]
                }
              ],
              temperature: 0,
              response_format: { type: "json_object" }
            });
            
            console.log(`✅ OpenAI API call successful`);
            console.log(`   Response choices: ${completion.choices?.length || 0}`);
          } catch (apiError) {
            console.error(`❌ OpenAI API Error:`, apiError.message);
            console.error(`   Error details:`, apiError);
            throw apiError;
          }

          let content = completion.choices[0]?.message?.content || '{}';
          const originalContent = content; // Keep original for fallback extraction
          
          console.log(`📄 Raw OpenAI OCR Response (first 1000 chars):`, content.substring(0, 1000));
          console.log(`📄 Full response length: ${content.length} chars`);
          
          if (!content || content === '{}' || content.trim().length === 0) {
            console.error(`❌ Empty response from OpenAI API`);
            throw new Error('Empty response from OpenAI API');
          }
          
          // FALLBACK: Try to extract LR number from raw text before parsing JSON
          // Sometimes OpenAI mentions LR numbers in explanations or text before JSON
          let fallbackLRNumber = null;
          const lrPatterns = [
            /LR\s*No[:\s]+(LR\d+)/i,
            /LR\s*Number[:\s]+(LR\d+)/i,
            /LR\s*No[:\s]+(\d{8,})/i,
            /(LR\d{8,})/i,
            /LR[:\s-]*(\d{8,})/i
          ];
          
          for (const pattern of lrPatterns) {
            const match = originalContent.match(pattern);
            if (match) {
              fallbackLRNumber = match[1].startsWith('LR') ? match[1] : `LR${match[1]}`;
              console.log(`🔍 Found LR Number in raw text (fallback): "${fallbackLRNumber}"`);
              break;
            }
          }
          
          // Clean JSON response - remove markdown code blocks
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          // Also remove any leading/trailing whitespace and newlines
          content = content.replace(/^\s+|\s+$/g, '');
          
          let parsed;
          try {
            parsed = JSON.parse(content);
            console.log(`✅ Parsed OCR JSON:`, JSON.stringify(parsed, null, 2));
          } catch (parseError) {
            console.error(`❌ Failed to parse OCR JSON:`, parseError.message);
            console.error(`Raw content:`, content);
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsed = JSON.parse(jsonMatch[0]);
                console.log(`✅ Extracted JSON from response:`, JSON.stringify(parsed, null, 2));
              } catch (e) {
                console.error(`❌ Still failed to parse extracted JSON`);
                throw parseError;
              }
            } else {
              throw parseError;
            }
          }
          
          // Handle both POD and Invoice formats
          // PRIORITY: Extract journeyNumber (LR Number) from multiple possible field names
          // IMPORTANT: Also check for "LR No" or "LR Number" in the parsed object keys
          const extractLRNumber = (parsed, fallbackLRNumber = null) => {
            let lrNumber = null;
            
            // NEW STRUCTURE: Check for nested invoiceDetails.lrNo first
            if (parsed.invoiceDetails && parsed.invoiceDetails.lrNo) {
              lrNumber = parsed.invoiceDetails.lrNo;
              console.log(`🔍 Found LR Number in invoiceDetails.lrNo: "${lrNumber}"`);
            }
            // OLD STRUCTURE: Try standard field names (for backward compatibility)
            else {
              lrNumber = parsed.journeyNumber || 
                     parsed.journey_number || 
                     parsed.lrNumber || 
                     parsed.lr_number || 
                     parsed.lrNo ||
                     parsed.lr_no ||
                     parsed.tripId ||
                     parsed.trip_id ||
                     parsed.lrId ||
                     parsed.lr_id ||
                     null;
              
              // If not found, check all keys for LR-related fields (case-insensitive)
              if (!lrNumber && parsed) {
                const keys = Object.keys(parsed);
                for (const key of keys) {
                  const lowerKey = key.toLowerCase();
                  // Check if key contains "lr" or "journey" or "trip"
                  if ((lowerKey.includes('lr') || lowerKey.includes('journey') || lowerKey.includes('trip')) 
                      && parsed[key] && typeof parsed[key] === 'string') {
                    // Check if value looks like an LR number (starts with LR or is numeric)
                    const value = String(parsed[key]).trim();
                    if (value.match(/^LR\d+/i) || value.match(/^\d{8,}/)) {
                      lrNumber = value;
                      console.log(`🔍 Found LR Number in field "${key}": "${value}"`);
                      break;
                    }
                  }
                }
              }
            }
            
            // If still not found and we have a fallback from raw text, use it
            if (!lrNumber && fallbackLRNumber) {
              lrNumber = fallbackLRNumber;
              console.log(`✅ Using fallback LR Number from raw text: "${lrNumber}"`);
            }
            
            console.log(`🔍 LR Number extraction attempt:`, {
              invoiceDetails_lrNo: parsed.invoiceDetails?.lrNo,
              journeyNumber: parsed.journeyNumber,
              journey_number: parsed.journey_number,
              lrNumber: parsed.lrNumber,
              lr_number: parsed.lr_number,
              lrNo: parsed.lrNo,
              lr_no: parsed.lr_no,
              tripId: parsed.tripId,
              trip_id: parsed.trip_id,
              lrId: parsed.lrId,
              lr_id: parsed.lr_id,
              allKeys: Object.keys(parsed),
              fallbackLRNumber: fallbackLRNumber,
              extracted: lrNumber
            });
            
            return lrNumber;
          };

          if (type.toLowerCase() === 'invoice') {
            // NEW STRUCTURE: Extract from nested invoiceDetails, chargeBreakup, materialDetails
            const invoiceDetails = parsed.invoiceDetails || {};
            const chargeBreakup = parsed.chargeBreakup || {};
            const materialDetails = parsed.materialDetails || {};
            
            // Build charges array from chargeBreakup
            const charges = [];
            if (chargeBreakup.tollCharges) charges.push({ type: 'Toll Charges', amount: chargeBreakup.tollCharges });
            if (chargeBreakup.unloadingCharges) charges.push({ type: 'Unloading Charges', amount: chargeBreakup.unloadingCharges });
            if (chargeBreakup.otherAddOnCharges) charges.push({ type: 'Other Add-on Charges', amount: chargeBreakup.otherAddOnCharges });
            if (chargeBreakup.sgst) charges.push({ type: 'SGST', amount: chargeBreakup.sgst });
            if (chargeBreakup.cgst) charges.push({ type: 'CGST', amount: chargeBreakup.cgst });
            
            ocrResult = {
              journeyNumber: extractLRNumber(parsed, fallbackLRNumber), // LR Number - PRIMARY MATCHING FIELD
              vehicleNumber: parsed.vehicleNumber || parsed.vehicle_number || parsed.vehicleNo || null, // May not be in new structure
              loadId: invoiceDetails.lcuNo || parsed.loadId || parsed.load_id || parsed.lcuNumber || parsed.lcuNo || null,
              invoiceNumber: invoiceDetails.invoiceNo || parsed.invoiceNumber || parsed.invoice_number || null,
              baseFreight: chargeBreakup.baseFreight || parsed.baseFreight || parsed.base_freight || null,
              totalAmount: chargeBreakup.totalPayableAmount || parsed.totalAmount || parsed.total_amount || null,
              charges: charges.length > 0 ? charges : (parsed.charges || []), // Use new structure charges or fallback to old
              confidence: parsed.confidence || 0.8,
              rawResponse: { content: originalContent, parsed },
              // Store full nested structure for reference
              invoiceDetails: invoiceDetails,
              chargeBreakup: chargeBreakup,
              materialDetails: materialDetails
            };
          } else {
            // POD documents - extract charges similar to invoices
            const chargeBreakup = parsed.chargeBreakup || {};
            const charges = [];
            
            // Build charges array from chargeBreakup if available
            if (chargeBreakup.tollCharges) charges.push({ type: 'Toll Charges', amount: chargeBreakup.tollCharges });
            if (chargeBreakup.unloadingCharges) charges.push({ type: 'Unloading Charges', amount: chargeBreakup.unloadingCharges });
            if (chargeBreakup.otherAddOnCharges) charges.push({ type: 'Other Add-on Charges', amount: chargeBreakup.otherAddOnCharges });
            if (chargeBreakup.sgst) charges.push({ type: 'SGST', amount: chargeBreakup.sgst });
            if (chargeBreakup.cgst) charges.push({ type: 'CGST', amount: chargeBreakup.cgst });
            
            ocrResult = {
              journeyNumber: extractLRNumber(parsed, fallbackLRNumber), // LR Number - PRIMARY MATCHING FIELD
              vehicleNumber: parsed.vehicleNumber || parsed.vehicle_number || null,
              loadId: parsed.loadId || parsed.load_id || null,
              baseFreight: chargeBreakup.baseFreight || parsed.baseFreight || parsed.base_freight || null,
              totalAmount: chargeBreakup.totalPayableAmount || parsed.totalAmount || parsed.total_amount || null,
              charges: charges.length > 0 ? charges : (parsed.charges || []), // Use chargeBreakup charges or fallback to parsed.charges
              confidence: parsed.confidence || 0.8,
              rawResponse: { content: originalContent, parsed },
              // Store nested structures for POD too
              chargeBreakup: chargeBreakup,
              invoiceDetails: parsed.invoiceDetails || null,
              materialDetails: parsed.materialDetails || null
            };
          }
          
          console.log(`📋 Final Extracted LR Number (journeyNumber): "${ocrResult.journeyNumber || 'NOT FOUND'}"`);
          console.log(`📋 Full OCR Result Summary:`, {
            journeyNumber: ocrResult.journeyNumber,
            vehicleNumber: ocrResult.vehicleNumber,
            loadId: ocrResult.loadId,
            invoiceNumber: ocrResult.invoiceNumber,
            baseFreight: ocrResult.baseFreight,
            totalAmount: ocrResult.totalAmount,
            chargesCount: ocrResult.charges?.length || 0
          });
          
          // ============================================================================
          // DEBUG STEP 4: Verify OCR JSON Key - Log entire OCR data
          // ============================================================================
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔍 DEBUG STEP 4: OCR Parsed Data Check');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`File: ${file.name}`);
          console.log(`OCR Extracted journeyNumber:`, ocrResult.journeyNumber);
          console.log(`OCR journeyNumber type:`, typeof ocrResult.journeyNumber);
          console.log(`OCR journeyNumber value:`, JSON.stringify(ocrResult.journeyNumber));
          console.log(`Full OCR Result Object Keys:`, Object.keys(ocrResult));
          console.log(`Raw OCR Data (first level):`, {
            journeyNumber: ocrResult.journeyNumber,
            invoiceDetails: ocrResult.invoiceDetails ? Object.keys(ocrResult.invoiceDetails) : null,
            chargeBreakup: ocrResult.chargeBreakup ? Object.keys(ocrResult.chargeBreakup) : null
          });
          if (ocrResult.invoiceDetails) {
            console.log(`invoiceDetails.lrNo:`, ocrResult.invoiceDetails.lrNo);
            console.log(`invoiceDetails.lrNo type:`, typeof ocrResult.invoiceDetails.lrNo);
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');

          // CRITICAL CHECK: Verify LR Number was extracted
          if (!ocrResult.journeyNumber) {
            const errorMsg = `❌ CRITICAL ERROR: LR Number (LR No) not found in OCR extraction for file: ${file.name}`;
            console.error('');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('🚨 LR NUMBER EXTRACTION FAILED');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error(errorMsg);
            console.error('');
            console.error('📋 What was checked:');
            console.error('   • JSON field: journeyNumber');
            console.error('   • JSON field: journey_number');
            console.error('   • JSON field: lrNumber, lr_number, lrNo, lr_no');
            console.error('   • JSON field: tripId, trip_id, lrId, lr_id');
            console.error('   • All object keys for LR-related fields');
            console.error('   • Raw text fallback extraction');
            console.error('');
            console.error('📄 Available fields in parsed JSON:');
            console.error('   ', Object.keys(parsed || {}).join(', ') || 'None');
            console.error('');
            console.error('📄 Raw OpenAI response (first 500 chars):');
            console.error('   ', originalContent.substring(0, 500));
            console.error('');
            console.error('💡 Possible reasons:');
            console.error('   1. PDF image quality too low for OCR');
            console.error('   2. LR Number not visible in the document');
            console.error('   3. LR Number in unexpected format/location');
            console.error('   4. OpenAI API not reading the PDF correctly');
            console.error('');
            console.error('🔧 This file will be marked as "needs_review" for manual processing.');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('');
            
            // Still continue processing - mark as needs_review
            // Don't throw error, but log it clearly
          }

          // ============================================================================
          // DEBUG STEP 3: Normalization Function (Single source of truth)
          // ============================================================================
          const normalizeLR = (value) => {
            if (!value) return '';
            return value
              .toString()
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, ''); // removes spaces, dashes, /, etc.
          };
          
          // Keep old normalize for backward compatibility
          const normalize = normalizeLR;
          
          // Also try partial matching (contains) for flexibility
          const containsMatch = (haystack, needle) => {
            const normalizedHaystack = normalize(haystack);
            const normalizedNeedle = normalize(needle);
            return normalizedHaystack.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedHaystack);
          };
          
          // ============================================================================
          // Find Matching Journey Function (match on LR Number and LCU Number)
          // ============================================================================
          const findMatchingJourney = (ocrData, journeysList) => {
            console.log(`🔍 findMatchingJourney called:`);
            console.log(`   ocrData type: ${typeof ocrData}`);
            console.log(`   ocrData keys:`, ocrData ? Object.keys(ocrData) : 'null');
            console.log(`   journeysList type: ${typeof journeysList}`);
            console.log(`   journeysList is array: ${Array.isArray(journeysList)}`);
            console.log(`   journeysList.length: ${journeysList?.length || 0}`);
            
            if (!ocrData || !journeysList || journeysList.length === 0) {
              console.log(`   ❌ Cannot match: OCR data or journeys list is empty`);
              console.log(`      ocrData: ${ocrData ? 'exists' : 'null'}`);
              console.log(`      journeysList: ${journeysList ? 'exists' : 'null'}`);
              console.log(`      journeysList.length: ${journeysList?.length || 0}`);
              return null;
            }
            
            // Extract LR and LCU from OCR (try multiple field names)
            const ocrLRRaw = ocrData.journeyNumber || ocrData.invoiceDetails?.lrNo || ocrData.lrNo || ocrData.lr_number;
            const ocrLR = normalizeLR(ocrLRRaw);
            const ocrLoadRaw = ocrData.loadId || ocrData.invoiceDetails?.lcuNo || ocrData.lcuNo || ocrData.lcu_no;
            const ocrLoad = normalizeLR(ocrLoadRaw);
            
            console.log(`🔍 Finding matching journey:`);
            console.log(`   OCR LR (raw): "${ocrLRRaw}"`);
            console.log(`   OCR LR (normalized): "${ocrLR}"`);
            console.log(`   OCR Load ID/LCU (raw): "${ocrLoadRaw}"`);
            console.log(`   OCR Load ID/LCU (normalized): "${ocrLoad}"`);
            console.log(`   Available journeys: ${journeysList.length}`);
            
            if (!ocrLR || ocrLR === '') {
              console.log(`   ⚠️ WARNING: OCR LR is empty after normalization!`);
              console.log(`      Raw value was: "${ocrLRRaw}"`);
            }
            
            // First try: Match on journey_number (which IS the LR Number in this system)
            console.log(`   🔍 Comparing OCR LR "${ocrLR}" against ${journeysList.length} journeys...`);
            let comparisonCount = 0;
            for (const journey of journeysList) {
              if (journey.journey_number) {
                const journeyLR = normalizeLR(journey.journey_number);
                comparisonCount++;
                if (comparisonCount <= 5) {
                  console.log(`   [${comparisonCount}] Comparing: OCR="${ocrLR}" vs DB="${journey.journey_number}" (normalized="${journeyLR}") → ${journeyLR === ocrLR ? '✅ MATCH!' : '❌ No match'}`);
                }
                if (journeyLR === ocrLR) {
                  console.log(`   ✅✅✅ EXACT MATCH FOUND BY journey_number! ✅✅✅`);
                  console.log(`      OCR LR: "${ocrLR}"`);
                  console.log(`      DB journey_number: "${journey.journey_number}" (normalized: "${journeyLR}")`);
                  console.log(`      Journey ID: ${journey.id}`);
                  return journey;
                }
              }
            }
            if (comparisonCount > 5) {
              console.log(`   ... (compared ${comparisonCount} total journeys)`);
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
            const availableLRs = journeysList.map(j => j.journey_number).filter(Boolean);
            const availableLCUs = journeysList.map(j => j.load_id).filter(Boolean);
            console.log(`   Available journey_number (LR) values (${availableLRs.length}):`, availableLRs.slice(0, 20));
            console.log(`   Available load_id (LCU) values (${availableLCUs.length}):`, availableLCUs.slice(0, 20));
            console.log(`   🔍 Debug: OCR LR normalized="${ocrLR}", Looking for exact match`);
            console.log(`   🔍 Debug: Sample DB LR normalized values:`, availableLRs.slice(0, 5).map(lr => normalizeLR(lr)));
            return null;
          };

          // ============================================================================
          // Use findMatchingJourney helper (simplified matching)
          // ============================================================================
          matchDetails = [];
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔍 MATCHING PROCESS');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // CRITICAL DEBUG: Check journeys array availability
          console.log(`📋 Journeys array check:`);
          console.log(`   journeys variable exists: ${typeof journeys !== 'undefined'}`);
          console.log(`   journeys is array: ${Array.isArray(journeys)}`);
          console.log(`   journeys.length: ${journeys?.length || 0}`);
          if (journeys && journeys.length > 0) {
            console.log(`   First journey sample:`, {
              id: journeys[0].id,
              journey_number: journeys[0].journey_number,
              load_id: journeys[0].load_id
            });
            console.log(`   All journey_numbers:`, journeys.slice(0, 10).map(j => j.journey_number).filter(Boolean));
          }
          
          if (!ocrResult.journeyNumber) {
            console.log(`❌ No LR Number extracted from OCR - cannot match`);
            console.log(`   ocrResult keys:`, Object.keys(ocrResult));
            console.log(`   ocrResult.journeyNumber:`, ocrResult.journeyNumber);
            console.log(`   ocrResult.invoiceDetails:`, ocrResult.invoiceDetails);
            matchDetails = ['No LR Number found in OCR extraction'];
            matchedJourney = null;
            matchScore = 0;
            isMatched = false;
          } else if (!journeys || journeys.length === 0) {
            console.log(`❌ No journeys loaded - cannot match`);
            console.log(`   journeys variable:`, journeys);
            console.log(`   journeys type:`, typeof journeys);
            matchDetails = ['No journeys available for matching'];
            matchedJourney = null;
            matchScore = 0;
            isMatched = false;
          } else {
            // Use the helper function
            console.log(`📋 About to call findMatchingJourney:`);
            console.log(`   ocrResult.journeyNumber: "${ocrResult.journeyNumber}"`);
            console.log(`   ocrResult.invoiceDetails?.lrNo: "${ocrResult.invoiceDetails?.lrNo}"`);
            console.log(`   ocrResult.loadId: "${ocrResult.loadId}"`);
            console.log(`   ocrResult.invoiceDetails?.lcuNo: "${ocrResult.invoiceDetails?.lcuNo}"`);
            console.log(`   journeys.length: ${journeys.length}`);
            if (journeys.length > 0) {
              console.log(`   Sample journey:`, { 
                id: journeys[0].id, 
                journey_number: journeys[0].journey_number,
                load_id: journeys[0].load_id
              });
            }
            
            matchedJourney = findMatchingJourney(ocrResult, journeys);
            
            if (matchedJourney) {
              matchDetails = [`LR Number matched: ${ocrResult.journeyNumber} = ${matchedJourney.journey_number}`];
              matchScore = 100;
              isMatched = true;
              console.log(`✅ Match Result: Journey ID ${matchedJourney.id} matched!`);
            } else {
              matchDetails = [`No matching journey found for LR: ${ocrResult.journeyNumber}`];
              matchScore = 0;
              isMatched = false;
              console.log(`❌ Match Result: No journey matched`);
              console.log(`   OCR extracted journeyNumber: "${ocrResult.journeyNumber}"`);
              console.log(`   OCR extracted invoiceDetails.lrNo: "${ocrResult.invoiceDetails?.lrNo}"`);
              console.log(`   OCR extracted loadId: "${ocrResult.loadId}"`);
              console.log(`   OCR extracted invoiceDetails.lcuNo: "${ocrResult.invoiceDetails?.lcuNo}"`);
            }
          }
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          
          console.log(`🎯 Final match result:`, {
            matched: isMatched,
            score: matchScore,
            journeyId: matchedJourney?.id,
            journeyLR: matchedJourney?.journey_number,
            details: matchDetails
          });

          console.log(`🎯 Match result:`, {
            matched: isMatched,
            score: matchScore,
            journeyId: matchedJourney?.id,
            details: matchDetails
          });

        } catch (ocrErr) {
          ocrError = ocrErr; // Store error in outer scope variable
          console.error(`❌ OCR error for ${file.name}:`, ocrErr.message);
          console.error(`   Error stack:`, ocrErr.stack);
          console.error(`   Full error:`, ocrErr);
          // Don't use fallback journey - set to null so it's marked as needs_review
          matchedJourney = null;
          ocrResult = {
            journeyNumber: null,
            vehicleNumber: null,
            loadId: null,
            invoiceNumber: null,
            baseFreight: null,
            totalAmount: null,
            charges: [],
            confidence: 0,
            rawResponse: { 
              error: ocrErr.message || 'OCR extraction failed',
              stack: ocrErr.stack,
              details: ocrErr.toString()
            }
          };
          matchScore = 0;
          isMatched = false;
        }

        // For invoices AND PODs, compare charges with proforma
        let chargeVariances = null;
        let proformaData = null;
        
        if (matchedJourney) {
          // Check if proforma exists (use the proformaByJourneyId map)
          proformaData = proformaByJourneyId.get(matchedJourney.id) || null;
          
          if (proformaData) {
            // Calculate charge variances for both invoices and PODs
            const documentBaseFreight = ocrResult.baseFreight || 0;
            const documentTotal = ocrResult.totalAmount || 0;
            const proformaBaseFreight = proformaData.base_freight || 0;
            const proformaTotal = proformaData.total_amount || 0;
            
            chargeVariances = {
              baseFreight: documentBaseFreight - proformaBaseFreight,
              tollCharge: (ocrResult.charges?.find(c => c.type?.toLowerCase().includes('toll'))?.amount || 0) - (proformaData.toll_charge || 0),
              unloadingCharge: (ocrResult.charges?.find(c => c.type?.toLowerCase().includes('unload'))?.amount || 0) - (proformaData.unloading_charge || 0),
              detentionCharge: (ocrResult.charges?.find(c => c.type?.toLowerCase().includes('detention'))?.amount || 0) - (proformaData.detention_charge || 0),
              otherCharges: (ocrResult.charges?.find(c => c.type?.toLowerCase().includes('other'))?.amount || 0) - (proformaData.other_charges || 0),
              gstAmount: (ocrResult.charges?.find(c => c.type?.toLowerCase().includes('gst'))?.amount || 0) - (proformaData.gst_amount || 0),
              totalAmount: documentTotal - proformaTotal
            };
            
            console.log(`💰 Charge variances:`, chargeVariances);
            
            // Note: Charge variance does NOT change match status
            // If journey matched (LR number found), it stays matched
            // Variance is shown in UI but doesn't affect tab placement
            const hasVariance = Math.abs(chargeVariances.totalAmount) > 0.01 || Math.abs(chargeVariances.baseFreight) > 0.01;
            if (hasVariance) {
              matchDetails.push(`Charge variance detected: ₹${chargeVariances.totalAmount.toFixed(2)}`);
            }
          } else {
            // Journey matched but no proforma/contract found
            console.log(`⚠️ Journey matched (LR: ${ocrResult.journeyNumber}) but no proforma found`);
            console.log(`   This means journey exists but no contract to compare`);
          }
        }

        if (isMatched) {
          matchedCount++;
        } else {
          needsReviewCount++;
        }

        // ALWAYS create item, even if no match (so it shows in "Needs Review")
        const itemData = {
          bulk_job_id: bulkJob.id,
          file_name: file.name,
          storage_path: storagePath, // Use storage_path column (exists in schema)
          journey_id: matchedJourney?.id || null,
          proforma_id: proformaData?.id || null, // Attach proforma ID if found
          ocr_extracted_data: {
            journeyNumber: ocrResult?.journeyNumber || null,
            vehicleNumber: ocrResult?.vehicleNumber || null,
            loadId: ocrResult?.loadId || null,
            invoiceNumber: ocrResult?.invoiceNumber || null,
            baseFreight: ocrResult?.baseFreight || null,
            totalAmount: ocrResult?.totalAmount || null,
            charges: ocrResult?.charges || [],
            confidence: ocrResult?.confidence || 0.5,
            rawResponse: ocrResult?.rawResponse || null,
            error: ocrError || null, // Store error if LR number not found
            // Include nested structures
            invoiceDetails: ocrResult?.invoiceDetails || null,
            chargeBreakup: ocrResult?.chargeBreakup || null,
            materialDetails: ocrResult?.materialDetails || null,
            // Add charge variances for invoices
            chargeVariances: chargeVariances,
            proformaData: proformaData,
            // Store file URL in OCR data since file_url column doesn't exist
            fileUrl: urlData?.publicUrl || null
          },
          match_status: isMatched ? 'matched' : 'mismatch', // matched = journey found, mismatch = no journey found
          match_details: {
            matchScore: matchScore,
            matchReason: matchDetails.join('; ') || (isMatched ? 'Auto-matched' : 'Needs review'),
            matchDetails: matchDetails,
            isMatched: isMatched
          },
          // Note: No 'status' column in schema - match_status is the status
        };
        
        // ============================================================================
        // CRITICAL DEBUG: Very loud logging around insert
        // ============================================================================
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🟡🟡🟡 PREPARING TO INSERT bulk_job_item 🟡🟡🟡');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`File: ${file.name}`);
        console.log(`Job ID: ${bulkJob.id}`);
        console.log(`Job ID type: ${typeof bulkJob.id}`);
        console.log(`Match Status: ${isMatched ? 'matched' : 'mismatch'}`);
        console.log(`LR Number from OCR: ${ocrResult?.journeyNumber || 'NOT FOUND'}`);
        console.log(`Journey ID: ${matchedJourney?.id || 'null'}`);
        console.log(`Storage Path: ${storagePath}`);
        console.log(`Table Name: bulk_job_items (VERIFY THIS MATCHES YOUR DB!)`);
        console.log(`Supabase URL: ${process.env.SUPABASE_URL || 'NOT SET'}`);
        console.log('');
        console.log('Item Payload (first level keys):');
        console.log(`  bulk_job_id: ${itemData.bulk_job_id}`);
        console.log(`  file_name: ${itemData.file_name}`);
        console.log(`  storage_path: ${itemData.storage_path}`);
        console.log(`  journey_id: ${itemData.journey_id}`);
        console.log(`  match_status: ${itemData.match_status}`);
        console.log(`  match_details:`, JSON.stringify(itemData.match_details));
        console.log(`  ocr_extracted_data keys:`, Object.keys(itemData.ocr_extracted_data));
        console.log('');
        console.log('Full Item Data (JSON):');
        console.log(JSON.stringify(itemData, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        
        console.log(`💾 Executing INSERT into bulk_job_items...`);
        const insertStartTime = Date.now();
        
        const { data: insertedItem, error: insertError } = await supabase
          .from('bulk_job_items')
          .insert(itemData)
          .select('id, bulk_job_id, file_name, match_status')
          .single();
        
        const insertDuration = Date.now() - insertStartTime;
        
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (insertError) {
          console.error('❌❌❌ FAILED INSERTING bulk_job_item ❌❌❌');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error(`File: ${file.name}`);
          console.error(`Job ID: ${bulkJob.id}`);
          console.error(`Error Code: ${insertError.code || 'N/A'}`);
          console.error(`Error Message: ${insertError.message || 'N/A'}`);
          console.error(`Error Details:`, insertError);
          console.error('');
          console.error('Common causes:');
          console.error('  1. RLS (Row Level Security) blocking insert');
          console.error('  2. NOT NULL constraint violation');
          console.error('  3. Foreign key constraint violation');
          console.error('  4. Wrong column name (snake_case vs camelCase)');
          console.error('  5. Wrong table name or database project');
          console.error('');
          console.error('Full error object:');
          console.error(JSON.stringify(insertError, null, 2));
          console.error('');
          console.error('Item data that failed to insert:');
          console.error(JSON.stringify(itemData, null, 2));
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('');
          throw new Error(`Failed to save item: ${insertError.message}`);
        } else {
          console.log('✅✅✅ SUCCESSFULLY INSERTED bulk_job_item ✅✅✅');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`Insert Duration: ${insertDuration}ms`);
          console.log(`Inserted Item ID: ${insertedItem?.id}`);
          console.log(`Inserted Item Data:`, insertedItem);
          console.log('');
          console.log('Verify in Supabase:');
          console.log(`  SELECT * FROM bulk_job_items WHERE id = '${insertedItem?.id}';`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
        }

        processedItems.push({
          fileName: file.name,
          status: isMatched ? 'matched' : 'mismatch',
          matchedJourneyId: matchedJourney?.id,
          matchScore,
          ocrData: {
            journeyNumber: ocrResult.journeyNumber,
            vehicleNumber: ocrResult.vehicleNumber,
            loadId: ocrResult.loadId,
            confidence: ocrResult.confidence
          },
        });

      } catch (error) {
        console.error('');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`❌❌❌ ERROR PROCESSING FILE: ${file.name} ❌❌❌`);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Error Type: ${error.constructor.name}`);
        console.error(`Error Message: ${error.message}`);
        console.error(`Error Stack:`, error.stack);
        console.error('');
        console.error('This error occurred during file processing.');
        console.error('If this is an insert error, check the logs above for details.');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('');
        failedCount++;
        processedItems.push({ fileName: file.name, status: 'skipped', reason: error.message });
      }
      
      console.log(`✅ Completed processing file ${processedItems.length}/${files.length}: ${file.name}`);
      console.log('');
    }
    
    // ============================================================================
    // CRITICAL DEBUG: Verify loop completed
    // ============================================================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 FILE PROCESSING LOOP COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total files processed: ${processedItems.length}`);
    console.log(`Matched: ${matchedCount}`);
    console.log(`Needs Review: ${needsReviewCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log('');
    console.log('If processedItems.length === 0, the loop never executed!');
    console.log('If processedItems.length < files.length, some files failed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // ============================================================================
    // CRITICAL DEBUG: Verify items exist before updating job
    // ============================================================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFYING ITEMS IN DATABASE BEFORE UPDATING JOB');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const { data: verifyItems, error: verifyError } = await supabase
      .from('bulk_job_items')
      .select('id, file_name, match_status')
      .eq('bulk_job_id', bulkJob.id);
    
    if (verifyError) {
      console.error('❌ Error verifying items:', verifyError);
    } else {
      console.log(`Items found in database for job ${bulkJob.id}: ${verifyItems?.length || 0}`);
      if (verifyItems && verifyItems.length > 0) {
        console.log('✅ Items exist in database:');
        verifyItems.forEach((item, idx) => {
          console.log(`  ${idx + 1}. ID: ${item.id}, File: ${item.file_name}, Match Status: ${item.match_status}`);
        });
      } else {
        console.error('❌ NO ITEMS FOUND IN DATABASE!');
        console.error('   This means inserts failed or were rolled back.');
        console.error('   Check error logs above for insert failures.');
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Update bulk job with final counts
    console.log(`📊 Updating bulk job ${bulkJob.id} with final counts...`);
    const { error: updateError } = await supabase
      .from('bulk_jobs')
      .update({
        processed_files: processedItems.length,
        matched_files: matchedCount,
        mismatch_files: needsReviewCount,
        failed_files: failedCount,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', bulkJob.id);
    
    if (updateError) {
      console.error('❌ Error updating bulk job:', updateError);
    } else {
      console.log('✅ Bulk job updated successfully');
    }

    console.log(`✅ Completed: ${matchedCount} matched`);

    return res.json({
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

  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/bulk-jobs/:jobId
app.get('/api/bulk-jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(`📊 Fetching bulk job: ${jobId}`);

    // First get the job
    const { data: job, error: jobError } = await supabase
      .from('bulk_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('❌ Job not found:', jobError);
      return res.status(404).json({ success: false, error: 'Bulk job not found' });
    }

    // Then get items separately (simpler query)
    const { data: items, error: itemsError } = await supabase
      .from('bulk_job_items')
      .select('*')
      .eq('bulk_job_id', jobId);

    if (itemsError) {
      console.error('❌ Error fetching items:', itemsError);
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
          ocr_extracted_data: item.ocr_extracted_data ? 'Present' : 'Missing',
          ocr_keys: item.ocr_extracted_data ? Object.keys(item.ocr_extracted_data) : []
  });
});
    } else {
      console.log('⚠️ No items found in database for this job!');
      console.log('   This could mean:');
      console.log('   1. Items were not created during bulk upload');
      console.log('   2. Items were deleted');
      console.log('   3. Job ID mismatch');
    }

    // Transform items with proper joins
    const transformedItems = await Promise.all((items || []).map(async (item) => {
      // Parse OCR data if it's a string (JSON stored in database)
      let ocrData = item.ocr_extracted_data || {};
      if (typeof ocrData === 'string') {
        try {
          ocrData = JSON.parse(ocrData);
        } catch (e) {
          console.error('Failed to parse OCR data:', e);
          ocrData = {};
        }
      }
      
      // Debug: Log OCR data structure
      console.log(`📋 Item ${item.id} OCR Data:`, {
        hasBaseFreight: ocrData.baseFreight !== null && ocrData.baseFreight !== undefined,
        baseFreight: ocrData.baseFreight,
        hasTotalAmount: ocrData.totalAmount !== null && ocrData.totalAmount !== undefined,
        totalAmount: ocrData.totalAmount,
        hasChargeBreakup: !!ocrData.chargeBreakup,
        chargeBreakupKeys: ocrData.chargeBreakup ? Object.keys(ocrData.chargeBreakup) : [],
        hasCharges: Array.isArray(ocrData.charges) && ocrData.charges.length > 0,
        chargesCount: ocrData.charges?.length || 0
      });
      
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

        // Get proforma with ALL charge fields
        const { data: proformaData } = await supabase
          .from('proformas')
          .select('base_freight, toll_charge, unloading_charge, detention_charge, other_charges, gst_amount, total_amount')
          .eq('journey_id', journey.id)
          .limit(1)
          .single();
        proforma = proformaData;
      }

      return {
        id: item.id,
        loadId: journey?.load_id || ocrData.loadId || 'Unknown',
        journeyNo: journey?.journey_number || ocrData.journeyNumber || 'Unknown',
        vehicle: journey?.vehicle_number || ocrData.vehicleNumber || 'Unknown',
        consignee: journey?.destination || 'Unknown',
        transporter: transporterName,
        document: item.file_name,
        documentUrl: item.ocr_extracted_data?.fileUrl || item.storage_path || null,
        autoApproval: item.match_status === 'matched' ? 'Passed' : (item.match_status === 'mismatch' ? 'Failed' : 'Pending'),
        matchScore: item.match_details?.matchScore || 0,
        status: item.match_status || 'pending_review', // Use match_status as status (no separate status column)
        match_status: item.match_status,
        journey_id: journey?.id,
        epod_status: journey?.epod_status || null,
        ocrData: {
          ...ocrData,
          // Include full nested structure if available
          invoiceDetails: ocrData.invoiceDetails,
          chargeBreakup: ocrData.chargeBreakup,
          materialDetails: ocrData.materialDetails,
          // Include error if present
          error: ocrData.error,
          // Include raw response for debugging
          rawResponse: ocrData.rawResponse
        },
        contractedCost: proforma?.total_amount || null, // Use null if no proforma (not 0)
        // Try multiple sources for invoice amount
        invoiceAmount: ocrData.totalAmount ?? 
                       ocrData.chargeBreakup?.totalPayableAmount ?? 
                       (ocrData.charges && Array.isArray(ocrData.charges) ? 
                         ocrData.charges.reduce((sum, c) => sum + (c.amount || 0), ocrData.baseFreight || 0) : null) ?? 
                       null,
        variance: (() => {
          const invoiceAmt = ocrData.totalAmount ?? ocrData.chargeBreakup?.totalPayableAmount ?? null;
          return proforma?.total_amount && invoiceAmt !== null ? (invoiceAmt - proforma.total_amount) : null;
        })(),
        charges: (() => {
          // Build charges array from ALL OCR charges + Base Freight
          const chargesArray = [];
          const addedChargeTypes = new Set(); // To prevent duplicates
          
          // Helper to add charge if not already added
          const addCharge = (id, type, contracted, invoice, variance) => {
            const typeKey = type.toLowerCase();
            if (!addedChargeTypes.has(typeKey)) {
              chargesArray.push({ id, type, contracted, invoice, variance });
              addedChargeTypes.add(typeKey);
            }
          };
          
          // 1. Base Freight (always first)
          // Try multiple sources for base freight
          const invoiceBaseFreight = ocrData.baseFreight ?? 
                                     ocrData.chargeBreakup?.baseFreight ?? 
                                     (ocrData.charges && Array.isArray(ocrData.charges) ? 
                                       ocrData.charges.find(c => c.type?.toLowerCase().includes('base'))?.amount : null) ?? 
                                     0;
          const contractedBaseFreight = proforma?.base_freight || null;
          
          console.log(`💰 Base Freight mapping:`, {
            ocrDataBaseFreight: ocrData.baseFreight,
            chargeBreakupBaseFreight: ocrData.chargeBreakup?.baseFreight,
            finalInvoiceBaseFreight: invoiceBaseFreight,
            contractedBaseFreight: contractedBaseFreight
          });
          addCharge(
            'base',
            'Base Freight',
            contractedBaseFreight,
            invoiceBaseFreight,
            contractedBaseFreight !== null ? (invoiceBaseFreight - contractedBaseFreight) : null
          );
          
          // 2. Process charges from ocrData.chargeBreakup FIRST (more structured)
          if (ocrData.chargeBreakup) {
            const cb = ocrData.chargeBreakup;
            
            // Toll Charges
            if (cb.tollCharges !== null && cb.tollCharges !== undefined) {
              addCharge(
                'toll',
                'Toll Charges',
                proforma?.toll_charge || null,
                cb.tollCharges,
                proforma?.toll_charge !== null && proforma?.toll_charge !== undefined ? (cb.tollCharges - proforma.toll_charge) : null
              );
            }
            
            // Unloading Charges
            if (cb.unloadingCharges !== null && cb.unloadingCharges !== undefined) {
              addCharge(
                'unloading',
                'Unloading Charges',
                proforma?.unloading_charge || null,
                cb.unloadingCharges,
                proforma?.unloading_charge !== null && proforma?.unloading_charge !== undefined ? (cb.unloadingCharges - proforma.unloading_charge) : null
              );
            }
            
            // Other Add-on Charges
            if (cb.otherAddOnCharges !== null && cb.otherAddOnCharges !== undefined) {
              addCharge(
                'other',
                'Other Add-on Charges',
                proforma?.other_charges || null,
                cb.otherAddOnCharges,
                proforma?.other_charges !== null && proforma?.other_charges !== undefined ? (cb.otherAddOnCharges - proforma.other_charges) : null
              );
            }
            
            // Handle GST split (SGST and CGST)
            if (cb.sgst !== null && cb.sgst !== undefined) {
              const contractedGst = proforma?.gst_amount || null;
              addCharge(
                'sgst',
                'SGST',
                contractedGst !== null ? (contractedGst / 2) : null,
                cb.sgst,
                contractedGst !== null ? (cb.sgst - (contractedGst / 2)) : null
              );
            }
            
            if (cb.cgst !== null && cb.cgst !== undefined) {
              const contractedGst = proforma?.gst_amount || null;
              addCharge(
                'cgst',
                'CGST',
                contractedGst !== null ? (contractedGst / 2) : null,
                cb.cgst,
                contractedGst !== null ? (cb.cgst - (contractedGst / 2)) : null
              );
            }
          }
          
          // 3. Process charges from ocrData.charges array (fallback for any charges not in chargeBreakup)
          if (ocrData.charges && Array.isArray(ocrData.charges)) {
            ocrData.charges.forEach((ocrCharge, index) => {
              const chargeType = ocrCharge.type || 'Unknown Charge';
              const invoiceAmount = ocrCharge.amount || 0;
              const typeKey = chargeType.toLowerCase();
              
              // Skip if already added from chargeBreakup
              if (addedChargeTypes.has(typeKey)) {
                return;
              }
              
              // Map OCR charge types to proforma fields
              let contractedAmount = null;
              if (typeKey.includes('toll')) {
                contractedAmount = proforma?.toll_charge || null;
              } else if (typeKey.includes('unload')) {
                contractedAmount = proforma?.unloading_charge || null;
              } else if (typeKey.includes('detention')) {
                contractedAmount = proforma?.detention_charge || null;
              } else if (typeKey.includes('other')) {
                contractedAmount = proforma?.other_charges || null;
              } else if (typeKey.includes('gst')) {
                contractedAmount = proforma?.gst_amount || null;
              }
              
              addCharge(
                `charge-${index}`,
                chargeType,
                contractedAmount,
                invoiceAmount,
                contractedAmount !== null ? (invoiceAmount - contractedAmount) : null
              );
            });
          }
          
          // Ensure all variances are calculated if contracted exists
          chargesArray.forEach(charge => {
            if (charge.variance === null && charge.contracted !== null && charge.contracted !== undefined) {
              charge.variance = charge.invoice - charge.contracted;
            }
          });
          
          return chargesArray;
        })(),
      };
    }));

    return res.json({
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

  } catch (error) {
    console.error('❌ Error fetching bulk job:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/bulk-jobs/:jobId (Review actions)
app.post('/api/bulk-jobs/:jobId', async (req, res) => {
  try {
    const { itemId, chargeActions, overallDecision, comments } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Missing itemId' });
    }

    // Get first user ID for reviewer
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : null;

    const { data: reviewAction, error: reviewError } = await supabase
      .from('review_actions')
      .insert({
        bulk_job_item_id: itemId,
        action: overallDecision || 'pending',
        charge_decisions: chargeActions || {},
        comments: comments || '',
        reviewed_by: userId,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('❌ Error saving review:', reviewError);
      return res.status(500).json({ error: 'Failed to save review action' });
    }

    await supabase.from('bulk_job_items').update({
      status: overallDecision === 'accepted' ? 'approved' : overallDecision === 'rejected' ? 'rejected' : 'pending_review',
    }).eq('id', itemId);

    return res.json({ success: true, reviewAction });

  } catch (error) {
    console.error('❌ Error saving review:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Freight Audit Backend API',
    version: '1.0.0',
    endpoints: {
      proformas: 'GET /api/proformas',
      bulkUpload: 'POST /api/bulk-upload',
      bulkJob: 'GET /api/bulk-jobs/:jobId',
      health: 'GET /health'
    }
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

