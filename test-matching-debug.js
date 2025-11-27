/**
 * DEBUG TEST SCRIPT: Golden Path Test for Matching
 * 
 * This script tests the matching logic with a known good case:
 * - LR Number: LR20257713
 * - Invoice: INV-24001
 * 
 * Run: node test-matching-debug.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Normalization function (same as in server-local.cjs)
const normalizeLR = (value) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // removes spaces, dashes, /, etc.
};

// Test configuration
const TEST_CONFIG = {
  expectedLRNumber: 'LR20257713',
  testPDFPath: null, // Will be set if PDF exists
  journeyId: null, // Will be fetched from DB
};

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 GOLDEN PATH MATCHING TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // STEP 1: Find journey with LR20257713
  console.log('STEP 1: Finding journey with LR Number LR20257713...');
  const { data: journeys, error: journeyError } = await supabase
    .from('journeys')
    .select('id, journey_number, load_id, vehicle_number')
    .eq('journey_number', TEST_CONFIG.expectedLRNumber)
    .limit(1);
  
  if (journeyError) {
    console.error('❌ Error fetching journey:', journeyError);
    process.exit(1);
  }
  
  if (!journeys || journeys.length === 0) {
    console.error(`❌ No journey found with journey_number = "${TEST_CONFIG.expectedLRNumber}"`);
    console.error('   This journey needs to exist in the database for the test to work.');
    console.error('   Check if the journey was created correctly.');
    process.exit(1);
  }
  
  const testJourney = journeys[0];
  TEST_CONFIG.journeyId = testJourney.id;
  
  console.log('✅ Found test journey:');
  console.log(`   ID: ${testJourney.id}`);
  console.log(`   journey_number: ${testJourney.journey_number}`);
  console.log(`   load_id: ${testJourney.load_id}`);
  console.log(`   vehicle_number: ${testJourney.vehicle_number}`);
  console.log('');
  
  // STEP 2: Try to find a test PDF (optional)
  console.log('STEP 2: Looking for test PDF...');
  const testPDFPaths = [
    './test-invoice.pdf',
    './test-pdf.pdf',
    './invoice-sample.pdf'
  ];
  
  let testPDFPath = null;
  for (const pdfPath of testPDFPaths) {
    if (fs.existsSync(pdfPath)) {
      testPDFPath = pdfPath;
      console.log(`✅ Found test PDF: ${pdfPath}`);
      break;
    }
  }
  
  if (!testPDFPath) {
    console.log('⚠️ No test PDF found. Skipping OCR extraction test.');
    console.log('   You can still test matching logic with mock OCR data.');
    console.log('');
  }
  
  // STEP 3: Test OCR extraction (if PDF exists)
  let extractedLRNumber = null;
  if (testPDFPath) {
    console.log('STEP 3: Testing OCR extraction...');
    try {
      const fileBuffer = fs.readFileSync(testPDFPath);
      const base64File = fileBuffer.toString('base64');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const invoicePrompt = `Extract the following information and return it as a JSON object:

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
      
      const result = await model.generateContent([
        invoicePrompt,
        {
          inlineData: {
            data: base64File,
            mimeType: 'application/pdf'
          }
        }
      ]);
      
      const response = result.response;
      const text = response.text();
      
      // Clean JSON response
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanedText);
      
      // Extract LR Number
      extractedLRNumber = parsed.invoiceDetails?.lrNo || 
                          parsed.journeyNumber || 
                          parsed.lrNumber || 
                          parsed.lrNo || 
                          null;
      
      console.log('✅ OCR Extraction Result:');
      console.log(`   Extracted LR Number: "${extractedLRNumber}"`);
      console.log(`   Type: ${typeof extractedLRNumber}`);
      console.log(`   Full parsed data:`, JSON.stringify(parsed, null, 2));
      console.log('');
    } catch (error) {
      console.error('❌ OCR extraction failed:', error.message);
      console.log('   Continuing with mock data...');
      console.log('');
    }
  }
  
  // STEP 4: Test Matching Logic
  console.log('STEP 4: Testing Matching Logic...');
  console.log('');
  
  // Use extracted LR or fallback to expected
  const testLRNumber = extractedLRNumber || TEST_CONFIG.expectedLRNumber;
  
  console.log('Matching Configuration:');
  console.log(`   OCR LR Number (raw): "${testLRNumber}"`);
  console.log(`   OCR LR Number (normalized): "${normalizeLR(testLRNumber)}"`);
  console.log(`   DB journey_number (raw): "${testJourney.journey_number}"`);
  console.log(`   DB journey_number (normalized): "${normalizeLR(testJourney.journey_number)}"`);
  console.log('');
  
  const ocrNormalized = normalizeLR(testLRNumber);
  const dbNormalized = normalizeLR(testJourney.journey_number);
  const exactMatch = ocrNormalized === dbNormalized;
  
  console.log('Comparison Result:');
  console.log(`   Normalized OCR: "${ocrNormalized}"`);
  console.log(`   Normalized DB:  "${dbNormalized}"`);
  console.log(`   Exact Match: ${exactMatch ? '✅ YES' : '❌ NO'}`);
  console.log('');
  
  if (exactMatch) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅✅✅ TEST PASSED! ✅✅✅');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`LR Number "${testLRNumber}" successfully matched with journey ${testJourney.id}`);
    console.log('');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌❌❌ TEST FAILED! ❌❌❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`LR Number "${testLRNumber}" did NOT match journey ${testJourney.id}`);
    console.log('');
    console.log('Debugging Info:');
    console.log(`   OCR normalized length: ${ocrNormalized.length}`);
    console.log(`   DB normalized length: ${dbNormalized.length}`);
    console.log(`   OCR normalized chars:`, ocrNormalized.split(''));
    console.log(`   DB normalized chars:`, dbNormalized.split(''));
    console.log('');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});


