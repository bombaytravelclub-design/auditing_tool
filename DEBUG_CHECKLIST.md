# 🔍 Matching Debug Checklist

This checklist helps identify why matching is showing zero results.

## Quick Checklist

Go through these steps **in order** when debugging matching issues:

### ✅ STEP 1: Journey Loading Check

**Question:** Are journeys actually being loaded?

**Check in logs:**
```
🔍 DEBUG STEP 1: Journey Loading Check
```

**What to verify:**
- [ ] `Journeys loaded count` is > 0
- [ ] Journey IDs from frontend match what's in database
- [ ] For invoices: Check if journeys have proformas (might be filtered out)

**If journeys.length === 0:**
- ❌ **Problem:** No journeys loaded → all files will show "no match"
- ✅ **Fix:** 
  - Check if journey IDs exist in database
  - For invoices: Ensure journeys have proformas
  - Check environment/tenant mismatch

---

### ✅ STEP 2: Field Mismatch Check

**Question:** Which DB field contains the LR Number?

**Check in logs:**
```
🔍 DEBUG STEP 2: Field Mismatch Check
```

**What to verify:**
- [ ] OCR LR Number is extracted correctly
- [ ] DB `journey_number` field contains LR numbers
- [ ] Compare OCR LR vs DB `journey_number` values

**If OCR LR doesn't match any `journey_number`:**
- ❌ **Problem:** Field mismatch (OCR reading wrong field or DB storing in different column)
- ✅ **Fix:** 
  - Check if LR is stored in `lr_no` or `lr_number` column instead
  - Update matching logic to use correct column
  - Verify OCR is extracting correct field

---

### ✅ STEP 3: Normalization Check

**Question:** Are normalized values matching?

**Check in logs:**
```
🔍 DEBUG STEP 3: Normalization Check
```

**What to verify:**
- [ ] `normOcr` and `normDb` are logged
- [ ] Both use same `normalizeLR()` function
- [ ] Normalized values are equal (even if raw values differ)

**If normalized values differ:**
- ❌ **Problem:** Normalization bug or different functions used
- ✅ **Fix:** 
  - Ensure single `normalizeLR()` function used everywhere
  - Check for typos in normalization logic
  - Verify both sides are normalized

---

### ✅ STEP 4: OCR JSON Key Verification

**Question:** Is OCR extracting the LR Number correctly?

**Check in logs:**
```
🔍 DEBUG STEP 4: OCR Parsed Data Check
```

**What to verify:**
- [ ] `OCR Extracted journeyNumber` is not null
- [ ] `journeyNumber` type is `string`
- [ ] `invoiceDetails.lrNo` exists (for invoices)
- [ ] Raw OCR data shows LR number

**If `journeyNumber` is null or empty:**
- ❌ **Problem:** OCR not extracting LR Number
- ✅ **Fix:** 
  - Check OCR prompt (should emphasize LR Number)
  - Verify PDF contains LR Number
  - Check Gemini API response
  - Review fallback regex extraction

---

### ✅ STEP 5: Environment/Tenant Check

**Question:** Are we querying the right database/environment?

**Check in logs:**
```
🔍 DEBUG STEP 5: Environment/Tenant Check
```

**What to verify:**
- [ ] Journey IDs from frontend match database
- [ ] Supabase URL is correct
- [ ] Environment variables are set
- [ ] No tenant/company filter mismatch

**If journey IDs don't match:**
- ❌ **Problem:** Environment mismatch
- ✅ **Fix:** 
  - Verify same Supabase project
  - Check company_id/branch_id filters
  - Ensure frontend sends correct IDs

---

### ✅ STEP 6: Golden Path Test

**Run test script:**
```bash
node test-matching-debug.js
```

**What it tests:**
- Finds journey with LR20257713
- Extracts LR from test PDF (if available)
- Tests normalization
- Verifies matching logic

**If test fails:**
- Check output for specific failure point
- Compare normalized values
- Verify journey exists in database

---

## Common Issues & Solutions

### Issue 1: "No journeys loaded"

**Symptoms:**
- `Journeys loaded count: 0`
- All files show "no match"

**Causes:**
1. Journey IDs don't exist in database
2. For invoices: Journeys don't have proformas (filtered out)
3. Environment mismatch

**Solution:**
- Check journey IDs in database
- For invoices: Create proformas or remove proforma requirement
- Verify Supabase connection

---

### Issue 2: "OCR LR doesn't match DB journey_number"

**Symptoms:**
- OCR extracts LR correctly
- DB has different values in `journey_number`
- Normalized values don't match

**Causes:**
1. LR stored in different column (`lr_no`, `lr_number`)
2. OCR extracting wrong field
3. Data inconsistency

**Solution:**
- Check all LR-related columns in database
- Update matching to use correct column
- Verify OCR prompt extracts correct field

---

### Issue 3: "Normalization mismatch"

**Symptoms:**
- Raw values look similar
- Normalized values differ
- Matching fails

**Causes:**
1. Different normalization functions
2. Special characters not handled
3. Case sensitivity

**Solution:**
- Use single `normalizeLR()` function
- Check normalization logic
- Verify both sides normalized

---

### Issue 4: "OCR not extracting LR Number"

**Symptoms:**
- `journeyNumber: null` in logs
- OCR error messages

**Causes:**
1. PDF quality too low
2. LR Number not visible in document
3. OCR prompt not effective
4. Gemini API issue

**Solution:**
- Improve PDF quality
- Enhance OCR prompt
- Check Gemini API response
- Use fallback regex extraction

---

## Debugging Workflow

1. **Upload a file** and check `server.log`
2. **Look for DEBUG STEP sections** in logs
3. **Go through checklist** above
4. **Identify the failing step**
5. **Apply the fix** for that step
6. **Re-test** and verify

---

## Log File Location

Backend logs are in: `server.log`

View logs:
```bash
tail -f server.log
```

Or search for specific debug step:
```bash
grep "DEBUG STEP" server.log
```

---

## Test Script

Run golden path test:
```bash
node test-matching-debug.js
```

This tests:
- Journey lookup
- OCR extraction (if PDF available)
- Normalization
- Matching logic

Expected output:
```
✅✅✅ TEST PASSED! ✅✅✅
```

