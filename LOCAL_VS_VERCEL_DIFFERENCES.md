# Differences Between Local and Vercel OCR Processing

## Key Differences Found:

### 1. **LR Number Extraction Logic**

**Local Server (`server-local.cjs`):**
- Has sophisticated `extractLRNumber()` function
- Checks `invoiceDetails.lrNo` FIRST (priority)
- Falls back to multiple field names: `journeyNumber`, `journey_number`, `lrNumber`, `lr_number`, `lrNo`, `lr_no`, `tripId`, `trip_id`, `lrId`, `lr_id`
- Searches through ALL object keys for LR-related fields (case-insensitive)
- Extracts LR number from raw text as fallback using regex patterns
- Much more comprehensive extraction

**Vercel API (`api/_lib/ocr.ts`):**
- Simple extraction: `invoiceDetails.lrNo || parsed.journeyNumber || undefined`
- No fallback search through keys
- No fallback from raw text
- Less robust extraction

### 2. **Invoice OCR Result Structure**

**Local Server:**
- Extracts from nested structure: `invoiceDetails`, `chargeBreakup`, `materialDetails`
- Builds charges array from `chargeBreakup` (Toll, Unloading, Other, SGST, CGST)
- Stores full nested structures in result
- More comprehensive data extraction

**Vercel API:**
- Extracts from nested structure correctly
- Builds charges array correctly
- Returns full structure BUT...
- **bulk-upload.ts** then strips it down to minimal fields

### 3. **Data Normalization in bulk-upload.ts**

**Local Server:**
- Keeps full OCR result structure
- Stores `invoiceDetails`, `chargeBreakup`, `materialDetails` in `ocrExtractedData`

**Vercel bulk-upload.ts:**
- Line 248-256: Normalizes invoice result but loses nested structures
- Only keeps: `journeyNumber`, `vehicleNumber`, `loadId`, `confidence`, `invoiceNumber`, `charges`, `totalAmount`
- Doesn't preserve `invoiceDetails`, `chargeBreakup`, `materialDetails` for storage

### 4. **OCR Extracted Data Storage**

**Local Server:**
- Stores comprehensive data:
  ```javascript
  ocrExtractedData = {
    journeyNumber,
    vehicleNumber,
    loadId,
    confidence,
    rawResponse,
    invoiceDetails,  // ✅ Full structure
    chargeBreakup,   // ✅ Full structure
    materialDetails  // ✅ Full structure
  }
  ```

**Vercel:**
- Stores minimal data:
  ```javascript
  ocrExtractedData = {
    journeyNumber,
    vehicleNumber,
    loadId,
    confidence,
    rawResponse
    // ❌ Missing invoiceDetails, chargeBreakup, materialDetails
  }
  ```

### 5. **Fallback LR Number Extraction**

**Local Server:**
- Has regex patterns to extract LR from raw text:
  - `/LR\s*No[:\s]+(LR\d+)/i`
  - `/LR\s*Number[:\s]+(LR\d+)/i`
  - `/LR\s*No[:\s]+(\d{8,})/i`
  - `/(LR\d{8,})/i`
  - `/LR[:\s-]*(\d{8,})/i`
- Uses fallback if structured extraction fails

**Vercel:**
- No fallback extraction from raw text
- Relies only on structured JSON response

## Impact:

1. **Matching Issues:** Vercel might fail to match journeys if LR number is in unexpected field names
2. **Data Loss:** Vercel doesn't store full invoice/charge breakdown data
3. **Less Robust:** Vercel OCR extraction is less forgiving of OCR response variations

## Solution:

Update Vercel OCR functions to match local server's comprehensive extraction logic.

