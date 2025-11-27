/**
 * Test OCR Extraction Debug Script
 * Tests what Gemini returns for invoice OCR
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function testOCR() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TESTING OCR EXTRACTION FOR INVOICE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Invoice OCR prompt (current version)
  const ocrPrompt = `You are extracting data from a freight INVOICE PDF document.

CRITICAL REQUIREMENT: Extract the LR Number (also called Journey Number, Trip ID, LR No, LR Number).
This is the MOST IMPORTANT field. Look for it in headers, tables, or anywhere in the document.
Common formats: LR20257713, LR-20257713, LR 20257713, or just the number 20257713.

Extract ALL fields you can find:
1. LR Number / Journey Number / Trip ID / LR No (MANDATORY - search everywhere)
2. Invoice number
3. Vehicle number / Registration number
4. Load ID / LCU number
5. Base freight amount
6. Additional charges (toll, detention, unloading, GST, etc.)
7. Total amount

Read exactly what is printed. Do not invent values. If LR Number is not visible, return null.

Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{
  "journeyNumber": "extracted LR number or null",
  "invoiceNumber": "string or null",
  "vehicleNumber": "string or null",
  "loadId": "string or null",
  "baseFreight": number or null,
  "totalAmount": number or null,
  "charges": [{"type": "string", "amount": number}],
  "confidence": 0.8
}`;

  console.log('📋 OCR Prompt:');
  console.log(ocrPrompt);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Check if user provided a PDF file path
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.log('ℹ️  Usage: node test-ocr-debug.js <path-to-pdf-file>');
    console.log('');
    console.log('📝 Expected PDF structure (based on image):');
    console.log('   Invoice Details Table:');
    console.log('     - LR No: LR20257713');
    console.log('     - Invoice No: INV-24001');
    console.log('     - LCU No: LCU95304199');
    console.log('   Charge Breakup:');
    console.log('     - Base Freight: 47,727.03');
    console.log('     - Toll Charges: 516.75');
    console.log('     - Unloading Charges: 1,052.18');
    console.log('     - SGST: 2,957.76');
    console.log('     - CGST: 2,957.76');
    console.log('     - Total Payable Amount: 58,169.23');
    console.log('');
    console.log('🔍 Testing with mock data extraction logic...');
    console.log('');
    
    // Test extraction logic
    const mockParsed = {
      journeyNumber: null, // Simulating what might be returned
      lrNo: 'LR20257713', // Maybe Gemini returns it as lrNo?
      invoiceNumber: 'INV-24001',
      baseFreight: 47727.03,
      totalAmount: 58169.23,
      charges: [
        { type: 'Toll Charges', amount: 516.75 },
        { type: 'Unloading Charges', amount: 1052.18 },
        { type: 'SGST', amount: 2957.76 },
        { type: 'CGST', amount: 2957.76 }
      ]
    };

    console.log('📦 Mock Parsed Response (what Gemini might return):');
    console.log(JSON.stringify(mockParsed, null, 2));
    console.log('');

    // Test extraction function
    const extractLRNumber = (parsed) => {
      return parsed.journeyNumber || 
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
    };

    const extractedLR = extractLRNumber(mockParsed);
    console.log('🔍 LR Number Extraction Test:');
    console.log(`   Input: ${JSON.stringify(mockParsed)}`);
    console.log(`   Extracted: "${extractedLR}"`);
    console.log(`   ✅ ${extractedLR ? 'SUCCESS' : '❌ FAILED - LR Number not found!'}`);
    console.log('');

    if (!extractedLR) {
      console.log('⚠️  PROBLEM IDENTIFIED:');
      console.log('   Gemini might be returning LR Number as "lrNo" but');
      console.log('   our extraction function checks "lrNo" AFTER checking');
      console.log('   other fields. However, if Gemini returns it as "lrNo"');
      console.log('   (camelCase), it should work.');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('   The extraction function already checks "lrNo" and "lr_no"');
      console.log('   So the issue might be:');
      console.log('   1. Gemini not extracting LR Number at all');
      console.log('   2. Gemini returning it with different casing/spacing');
      console.log('   3. PDF image quality preventing OCR');
      console.log('');
    }

    process.exit(0);
  }

  // If PDF path provided, try to read and process it
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`📄 Reading PDF: ${pdfPath}`);
  const fileBuffer = fs.readFileSync(pdfPath);
  const base64File = fileBuffer.toString('base64');
  const fileExt = path.extname(pdfPath).toLowerCase();
  const mimeType = fileExt === '.pdf' ? 'application/pdf' : 'image/png';

  console.log(`📊 File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`📋 MIME type: ${mimeType}`);
  console.log('');

  try {
    console.log('🔄 Calling Gemini API...');
    const result = await model.generateContent([
      ocrPrompt,
      {
        inlineData: {
          data: base64File,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    let content = response.text().trim();

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 RAW GEMINI RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(content);
    console.log('');

    // Clean JSON response
    let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    cleanedContent = cleanedContent.replace(/^\s+|\s+$/g, '');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧹 CLEANED CONTENT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(cleanedContent);
    console.log('');

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
      // Try to extract JSON
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Extracted JSON from response');
        } catch (e) {
          console.error('❌ Still failed to parse');
          process.exit(1);
        }
      } else {
        process.exit(1);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 PARSED JSON:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(parsed, null, 2));
    console.log('');

    // Test extraction
    const extractLRNumber = (parsed) => {
      const lrNumber = parsed.journeyNumber || 
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
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 LR NUMBER EXTRACTION:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Available fields:', Object.keys(parsed));
      console.log('');
      console.log('Field values checked:');
      console.log(`  journeyNumber: ${parsed.journeyNumber || 'null'}`);
      console.log(`  journey_number: ${parsed.journey_number || 'null'}`);
      console.log(`  lrNumber: ${parsed.lrNumber || 'null'}`);
      console.log(`  lr_number: ${parsed.lr_number || 'null'}`);
      console.log(`  lrNo: ${parsed.lrNo || 'null'}`);
      console.log(`  lr_no: ${parsed.lr_no || 'null'}`);
      console.log(`  tripId: ${parsed.tripId || 'null'}`);
      console.log(`  trip_id: ${parsed.trip_id || 'null'}`);
      console.log(`  lrId: ${parsed.lrId || 'null'}`);
      console.log(`  lr_id: ${parsed.lr_id || 'null'}`);
      console.log('');
      console.log(`✅ Extracted LR Number: "${lrNumber || 'NOT FOUND'}"`);
      console.log('');

      return lrNumber;
    };

    const extractedLR = extractLRNumber(parsed);

    // Test matching
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 MATCHING TEST:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const normalize = (str) => {
      if (!str) return '';
      return str.toString().trim().toUpperCase().replace(/[\s\-_]/g, '').replace(/[^A-Z0-9]/g, '');
    };

    const dbLR = 'LR20257713';
    const ocrLR = extractedLR;
    
    if (ocrLR) {
      const normalizedOCR = normalize(ocrLR);
      const normalizedDB = normalize(dbLR);
      const match = normalizedOCR === normalizedDB;
      
      console.log(`OCR LR: "${ocrLR}" → Normalized: "${normalizedOCR}"`);
      console.log(`DB LR:  "${dbLR}" → Normalized: "${normalizedDB}"`);
      console.log(`Match: ${match ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ Cannot test matching - LR Number not extracted');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testOCR().catch(console.error);


