# 📋 Complete Bulk Upload Flow

## Overview
This document describes **every step** that happens after a user clicks "Upload & Process" in the Bulk Upload screen.

---

## 🚀 Step-by-Step Process

### **STEP 1: Frontend - User Clicks "Upload & Process"**
**Location:** `src/pages/BulkUpload.tsx`

1. User selects:
   - Document type (POD or Invoice)
   - Journey(s) to match against
   - File(s) to upload

2. User clicks "Upload & Process" button

3. Frontend calls `uploadBulkDocuments()` function:
   - Converts files to base64 encoding
   - Prepares request payload:
     ```javascript
     {
       type: 'POD' | 'Invoice',
       journeyIds: ['uuid1', 'uuid2', ...],
       files: [
         {
           name: 'file.pdf',
           type: 'application/pdf',
           size: 12345,
           data: 'base64encodeddata...'
         }
       ]
     }
     ```

4. Sends POST request to: `http://localhost:3000/api/bulk-upload`

---

### **STEP 2: Backend - Receives Upload Request**
**Location:** `server-local.cjs` - `POST /api/bulk-upload`

1. **Validates Request:**
   - Checks if `type` is provided
   - Checks if `journeyIds` array exists and has items
   - Checks if `files` array exists and has items
   - Returns 400 error if validation fails

2. **Gets User ID:**
   - Fetches first user from `users` table
   - Uses this as `uploaded_by` (in production, would come from auth)

3. **Creates Bulk Job Record:**
   ```sql
   INSERT INTO bulk_jobs (
     job_type,           -- 'pod' or 'invoice'
     total_files,        -- Number of files
     processed_files,    -- 0 initially
     matched_files,      -- 0 initially
     mismatch_files,     -- 0 initially
     failed_files,       -- 0 initially
     status,             -- 'processing'
     uploaded_by         -- User UUID
   )
   ```
   - Returns the created job with `id` (UUID)

---

### **STEP 3: Fetch Selected Journeys**
**Location:** `server-local.cjs` - Lines 177-218

**For Invoice Type:**
- Fetches journeys with their proformas:
  ```sql
  SELECT 
    id, journey_number, load_id, vehicle_number,
    proformas (
      id, base_freight, toll_charge, unloading_charge,
      detention_charge, other_charges, gst_amount, total_amount
    )
  FROM journeys
  WHERE id IN (journeyIds)
  ```

**For POD Type:**
- Fetches basic journey info:
  ```sql
  SELECT id, journey_number, load_id, vehicle_number
  FROM journeys
  WHERE id IN (journeyIds)
  ```

**Note:** If no journeys found, logs warning but continues processing

---

### **STEP 4: Process Each File (Loop)**
**Location:** `server-local.cjs` - Lines 235-856

For each file in the `files` array:

#### **4.1: Prepare File for Upload**
- Sanitize filename:
  - Remove special characters (replace with `_`)
  - Replace spaces with `_`
  - Limit to 255 characters
  - Example: `"Screenshot 2025-11-26 at 11.05.30 PM.png"` → `"Screenshot_2025-11-26_at_11.05.30_PM.png"`

- Create storage path:
  - Invoice: `invoice/${timestamp}-${sanitizedFileName}`
  - POD: `pod/${timestamp}-${sanitizedFileName}`

- Convert base64 to Buffer:
  ```javascript
  const fileBuffer = Buffer.from(file.data, 'base64');
  ```

#### **4.2: Upload to Supabase Storage**
- Uploads file to `documents` bucket:
  ```javascript
  supabase.storage
    .from('documents')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false
    })
  ```

- **If upload fails:** Logs error but continues with OCR (file buffer is still available)

- Gets public URL:
  ```javascript
  const urlData = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath)
  ```

#### **4.3: Run OCR Extraction**
**Location:** `server-local.cjs` - Lines 259-732

**Initialize Gemini AI:**
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
```

**Select OCR Prompt Based on Type:**

**For Invoice:**
```
Extract the following information and return it as a JSON object:

Invoice Details:
- Transporter name
- Consignor name
- Invoice No
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
  "invoiceDetails": { ... },
  "chargeBreakup": { ... },
  "materialDetails": { ... }
}
```

**For POD:**
```
Extract all relevant fields from this POD (Proof of Delivery) document.

Read only what is present—no assumptions.

If the document contains multiple materials, capture every row accurately.

Return extracted data in a structured list of fields and values. No extra commentary.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "journeyNumber": "string or null",
  "vehicleNumber": "string or null",
  "loadId": "string or null",
  "charges": [
    {"type": "string", "amount": number}
  ],
  "totalAmount": number or null,
  "confidence": 0.8
}
```

**Call Gemini API:**
```javascript
const result = await model.generateContent([
  ocrPrompt,
  {
    inlineData: {
      mimeType: file.type,
      data: file.data // base64
    }
  }
]);

const response = await result.response;
const text = response.text();
```

**Parse OCR Response:**
1. Clean JSON (remove markdown wrappers if present)
2. Parse JSON string to object
3. Extract LR Number (journeyNumber):
   - Try: `parsed.invoiceDetails.lrNo`
   - Try: `parsed.journeyNumber`
   - Try: `parsed.journey_number`
   - Fallback: Regex search in raw text for `LR\d+` pattern

4. Build OCR result object:
   ```javascript
   {
     journeyNumber: "LR20257713",      // LR Number - PRIMARY MATCHING KEY
     vehicleNumber: "MH12AB1234",
     loadId: "LCU95304199",
     invoiceNumber: "INV-24001",       // For invoices only
     baseFreight: 47727.03,            // For invoices only
     totalAmount: 58169.23,
     charges: [
       { type: "Toll Charges", amount: 516.75 },
       { type: "Unloading Charges", amount: 1052.18 },
       { type: "SGST", amount: 2957.76 },
       { type: "CGST", amount: 2957.76 }
     ],
     confidence: 0.8,
     rawResponse: { content: text, parsed: parsed },
     invoiceDetails: { ... },          // For invoices only
     chargeBreakup: { ... },          // For invoices only
     materialDetails: { ... }          // For invoices only
   }
   ```

**Error Handling:**
- If OCR fails, catches error and creates fallback result
- Logs detailed error messages
- Continues processing (marks as needs_review)

#### **4.4: Match OCR Data with Journeys**
**Location:** `server-local.cjs` - Lines 607-732

**Matching Logic (LR Number ONLY):**

1. **Normalize Function:**
   ```javascript
   normalize(str) {
     // Remove spaces, hyphens, underscores
     // Convert to uppercase
     // Keep only alphanumeric
     // Example: "LR-2025 7713" → "LR20257713"
   }
   ```

2. **Match Process:**
   - **If no LR Number extracted:** 
     - Match status: `needs_review`
     - Match reason: "No LR Number found in OCR extraction"
   
   - **If no journeys loaded:**
     - Match status: `needs_review`
     - Match reason: "No journeys available for matching"
   
   - **If LR Number found:**
     - Loop through all journeys
     - Compare normalized OCR LR Number with normalized `journey_number`
     - **Exact match:** `normalize(ocrLR) === normalize(journey.journey_number)`
       - Match status: `matched`
       - Match score: 100
       - Stops searching (found exact match)
     
     - **Partial match:** `containsMatch(journey.journey_number, ocrLR)`
       - Match status: `matched` (if no exact match found)
       - Match score: 80
       - Continues searching for exact match

3. **For Invoices - Charge Comparison:**
   - If journey matched and has proforma:
     - Compare invoice charges with proforma charges:
       ```javascript
       chargeVariances = {
         baseFreight: invoiceBaseFreight - proformaBaseFreight,
         tollCharge: invoiceToll - proformaToll,
         unloadingCharge: invoiceUnloading - proformaUnloading,
         detentionCharge: invoiceDetention - proformaDetention,
         otherCharges: invoiceOther - proformaOther,
         gstAmount: invoiceGST - proformaGST,
         totalAmount: invoiceTotal - proformaTotal
       }
       ```
     - If variance > 0.01:
       - Override match status to `needs_review`
       - Add reason: "Charge variance detected"

#### **4.5: Create Bulk Job Item**
**Location:** `server-local.cjs` - Lines 790-834

**Insert into `bulk_job_items` table:**
```sql
INSERT INTO bulk_job_items (
  bulk_job_id,              -- UUID of bulk job
  file_name,                -- Original filename
  storage_path,             -- Path in Supabase Storage
  journey_id,               -- Matched journey UUID (or NULL)
  ocr_extracted_data,       -- JSONB with all OCR data
  match_status,             -- 'matched' or 'needs_review'
  match_score,              -- 0-100
  match_reason,             -- Human-readable reason
  status                    -- 'pending_review'
)
```

**OCR Extracted Data Structure:**
```json
{
  "journeyNumber": "LR20257713",
  "vehicleNumber": "MH12AB1234",
  "loadId": "LCU95304199",
  "invoiceNumber": "INV-24001",
  "baseFreight": 47727.03,
  "totalAmount": 58169.23,
  "charges": [
    { "type": "Toll Charges", "amount": 516.75 },
    { "type": "Unloading Charges", "amount": 1052.18 },
    { "type": "SGST", "amount": 2957.76 },
    { "type": "CGST", "amount": 2957.76 }
  ],
  "confidence": 0.8,
  "rawResponse": {
    "content": "Full Gemini response text...",
    "parsed": { ... }
  },
  "error": null,
  "invoiceDetails": { ... },
  "chargeBreakup": { ... },
  "materialDetails": { ... },
  "chargeVariances": { ... },
  "proformaData": { ... },
  "fileUrl": "https://...supabase.co/storage/..."
}
```

**Update Counters:**
- If matched: `matchedCount++`
- If needs review: `needsReviewCount++`
- If error: `failedCount++`

**Error Handling:**
- If insert fails, logs detailed error
- Throws error (caught by outer try-catch)
- Marks file as 'skipped' in processedItems

---

### **STEP 5: Update Bulk Job Status**
**Location:** `server-local.cjs` - Lines 858-875

After processing all files:

```sql
UPDATE bulk_jobs SET
  processed_files = files.length,
  matched_files = matchedCount,
  mismatch_files = needsReviewCount,
  failed_files = failedCount,
  status = 'completed',
  updated_at = NOW()
WHERE id = bulkJob.id
```

---

### **STEP 6: Return Response to Frontend**
**Location:** `server-local.cjs` - Lines 876-882

**Success Response:**
```json
{
  "success": true,
  "jobId": "uuid-of-bulk-job",
  "summary": {
    "totalFiles": 1,
    "matched": 0,
    "needsReview": 1,
    "skipped": 0
  },
  "items": [
    {
      "fileName": "file.pdf",
      "status": "needs_review",
      "matchedJourneyId": null,
      "matchScore": 0,
      "ocrData": {
        "journeyNumber": "LR20257713",
        "vehicleNumber": "MH12AB1234",
        "loadId": "LCU95304199",
        "confidence": 0.8
      }
    }
  ]
}
```

---

### **STEP 7: Frontend - Handle Response**
**Location:** `src/pages/BulkUpload.tsx`

1. Receives response from API
2. Shows success message
3. Navigates to Review Workspace:
   ```javascript
   navigate(`/review/${jobId}`)
   ```

---

### **STEP 8: Frontend - Review Workspace Loads**
**Location:** `src/pages/ReviewWorkspace.tsx`

1. Fetches job details:
   ```
   GET /api/bulk-jobs/:jobId
   ```

2. Backend returns:
   ```json
   {
     "success": true,
     "job": {
       "id": "uuid",
       "type": "invoice",
       "status": "completed",
       "totalFiles": 1,
       "matched": 0,
       "needsReview": 1,
       "skipped": 0
     },
     "items": [
       {
         "id": "item-uuid",
         "loadId": "LCU95304199",
         "journeyNo": "LR20257713",
         "vehicle": "MH12AB1234",
         "consignee": "Surat, GJ",
         "document": "file.pdf",
         "documentUrl": "https://...",
         "autoApproval": "Failed",
         "matchStatus": "needs_review",
         "journey_id": null,
         "ocrData": {
           "journeyNumber": "LR20257713",
           "vehicleNumber": "MH12AB1234",
           "loadId": "LCU95304199",
           "invoiceNumber": "INV-24001",
           "baseFreight": 47727.03,
           "totalAmount": 58169.23,
           "charges": [...],
           "rawResponse": {...},
           "invoiceDetails": {...},
           "chargeBreakup": {...}
         },
         "contractedCost": 0,
         "invoiceAmount": 58169.23,
         "variance": 58169.23,
         "charges": [...]
       }
     ]
   }
   ```

3. Frontend displays:
   - OCR extracted data section
   - Summary tab (matched items)
   - Needs Review tab (unmatched items)
   - Each item shows OCR data, match status, actions

---

## 🔑 Key Points

1. **OCR runs BEFORE matching** - Data is extracted first, then matched
2. **OCR output IS saved** - Stored in `bulk_job_items.ocr_extracted_data` (JSONB)
3. **Matching is LR Number ONLY** - Uses `journey_number` field from journeys table
4. **Items are ALWAYS created** - Even if no match found (marked as `needs_review`)
5. **File URL stored in OCR data** - Since `file_url` column doesn't exist in schema

---

## 📊 Database Tables Involved

1. **bulk_jobs** - Job metadata
2. **bulk_job_items** - Individual file results with OCR data
3. **journeys** - Journey data for matching
4. **proformas** - Proforma data for invoice charge comparison
5. **users** - User who uploaded

---

## 🐛 Common Issues & Fixes

1. **Items not created:**
   - ✅ Fixed: `file_url` column doesn't exist → Use `storage_path`
   - ✅ Fixed: `ocrError` undefined → Initialize before try block

2. **OCR not extracting LR Number:**
   - Check Gemini API response
   - Check raw text fallback extraction
   - Verify PDF quality

3. **No matches found:**
   - Verify journeys exist with correct `journey_number`
   - Check normalization logic
   - Verify LR Number format matches

---

## 📝 Summary

**Complete Flow:**
```
User clicks Upload
  ↓
Frontend sends files + journey IDs
  ↓
Backend creates bulk_job record
  ↓
For each file:
  ├─ Upload to Supabase Storage
  ├─ Run OCR (Gemini API)
  ├─ Extract LR Number + charges
  ├─ Match with journeys (LR Number only)
  ├─ Compare charges (for invoices)
  └─ Save item to bulk_job_items with OCR data
  ↓
Update bulk_job status
  ↓
Return jobId to frontend
  ↓
Frontend navigates to Review Workspace
  ↓
Display OCR output + match results
```


