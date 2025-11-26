# 🧪 Testing Guide - Real PDF Processing

This guide will help you test the complete end-to-end flow with real PDFs.

---

## ✅ Prerequisites

- [x] Supabase database tables created
- [x] Storage buckets created (`npm run setup-storage`)
- [x] Environment variables configured
- [x] Application running locally (`npm run dev`)

---

## 📝 Test Flow

### Step 1: Prepare Test PDFs

You'll need some PDF files that contain:
- **For POD Upload:**
  - Vehicle number (e.g., MH02AB1234)
  - Load ID / LCU number (e.g., LCU-2024-001)
  - Journey number / LR number
  
- **For Invoice Upload:**
  - Same identifiers as above
  - Charge breakdown:
    - Base Freight: ₹XX,XXX
    - Toll Charges: ₹X,XXX
    - Unloading Charges: ₹X,XXX
    - Total Amount: ₹XX,XXX

**Tip:** You can use any invoice or POD PDF. The OCR will extract whatever it can find.

---

### Step 2: Start the Application

```bash
cd /Users/admin/Desktop/freight-audit-backend
npm run dev
```

Access at: http://localhost:5174

---

### Step 3: Select Journeys

1. Go to the dashboard (http://localhost:5174)
2. Select "ePOD Pending" or "ePOD Approved" tab
3. Check 3-5 journeys from the table
4. Note the LCU numbers of selected journeys

---

### Step 4: Upload PDFs

1. Click "Bulk Upload POD" button
2. Drag & drop your PDF files OR click "Select Files"
3. Upload 3-10 PDF files
4. Verify files appear in grid layout
5. Click "Upload & Process"

---

### Step 5: Watch Processing

You'll see the processing screen with:
- Real-time progress bar
- Step-by-step status:
  1. ✓ Uploading documents → **Files uploaded to Supabase**
  2. ✓ Running OCR extraction → **GPT-4o processing PDFs**
  3. ✓ Matching with journey data → **Auto-matching logic**
  4. ✓ Validating information → **Variance calculation**
  5. ✓ Finalizing results → **Saving to database**

**Processing time:** 2-5 seconds per PDF

**What's happening behind the scenes:**
- Files uploaded to Supabase Storage (bucket: `documents/pod/`)
- Each PDF sent to OpenAI GPT-4o for OCR
- Extracted data matched against selected journeys
- Match scores calculated (vehicle, load ID, journey#)
- Results stored in `bulk_jobs` and `bulk_job_items` tables

---

### Step 6: Review Extracted Data

After processing completes, you'll auto-navigate to Review Workspace.

**You'll see:**
- **Summary tab:** All matched/passed items
- **Needs Review tab:** Items with low confidence or no match
- **Skipped Loads tab:** Failed uploads or errors

**For each item:**
- Load ID (from database)
- Vehicle (OCR extracted)
- Consignee
- Attached Document (clickable)
- Status (Passed/Failed based on match score)
- **View Details button** (NEW!)

---

### Step 7: View Variance Details

1. Click "View" button (👁️) on any row
2. Modal opens showing:
   - Load ID, Vehicle, Consignee
   - **Contracted Cost** (from proforma in database)
   - **Invoice Amount** (OCR extracted from PDF)
   - **Variance** (calculated difference)
   - **Charge Breakup Table:**
     - Each charge type (Base, Toll, Unloading, etc.)
     - Contracted vs Invoice amounts
     - Individual variances

---

### Step 8: Review & Action on Charges

For each charge in the table:

**Option A: Accept Charge**
1. Click "Accept" button
2. Charge marked as accepted (green badge ✓)
3. Toast notification confirms

**Option B: Reject Charge**
1. Click "Reject" button
2. Comment textarea appears below charge
3. Enter rejection reason (required)
4. Click "Confirm Reject"
5. Charge marked as rejected (red badge ✗)

**Option C: Add Comment**
1. Click comment icon (💬)
2. Textarea expands below charge
3. Enter your comment
4. Click "Save Comment"
5. Comment displays below charge row

---

### Step 9: Overall Decision

At the bottom of the modal:
- If variance > 0: Warning message + Accept/Reject buttons
- If variance = 0: Success message + Accept button

Click "Accept" or "Reject" to save overall decision.

**What happens:**
- All charge-level actions saved to database
- Overall decision recorded
- Item status updated
- Audit trail created

---

### Step 10: Verify Database

Check your Supabase dashboard to see:

**bulk_jobs table:**
- New job record with status "completed"
- Counts for matched/needs_review/skipped

**bulk_job_items table:**
- One row per uploaded PDF
- OCR extracted data in `ocr_extracted_data` column
- Match scores and reasons
- Status (pending_review/approved/rejected)

**review_actions table:**
- Your accept/reject decisions
- Charge-level actions
- Comments

**pod_documents table:**
- POD metadata for matched items
- Links to journey records

---

## 🐛 Troubleshooting

### Issue: "Failed to process files"

**Possible causes:**
1. OpenAI API key invalid or expired
2. Supabase connection issue
3. Storage bucket doesn't exist

**Solutions:**
- Check `.env.local` has all keys
- Verify OpenAI API key at: https://platform.openai.com/api-keys
- Run `npm run setup-storage` again
- Check browser console for detailed errors

### Issue: "No variance data showing"

**Cause:** OCR couldn't extract charges from PDF

**Solution:**
- PDFs need clear charge information
- Try PDFs with visible charge breakdowns
- Check OCR extracted data in browser console

### Issue: "OCR extraction taking too long"

**Normal:** 2-5 seconds per PDF  
**Slow:** 10+ seconds (high-res PDFs, many pages)

**Tips:**
- Use single-page PDFs for faster processing
- Compress PDFs before upload
- OCR timeout is set to 60 seconds

### Issue: "Files not uploading"

**Check:**
- File size < 50MB
- File type is PDF, PNG, or JPG
- Network connection stable
- Supabase storage quota not exceeded

---

## 📊 Expected Results

### Good Match (Score ≥ 50):
```
LCU-2024-001
Vehicle: MH02AB1234
Status: Passed ✓
Match Reason: "Load ID match, Vehicle match"
Variance: ₹0 or small amount
```

### Needs Review (Score 1-49):
```
LCU-2024-002
Vehicle: KA03CD5678
Status: Failed ⚠️
Match Reason: "Vehicle match only"
Variance: May vary
```

### Skipped (Score 0):
```
unknown_file.pdf
Status: Skipped
Reason: "No matching data found"
```

---

## 💰 Cost Tracking

Monitor your OpenAI usage:
- Dashboard: https://platform.openai.com/usage
- Set spending limits
- Track cost per upload

**Example costs:**
- 1 single-page PDF: ~$0.01-0.02
- 1 multi-page PDF: ~$0.03-0.05
- 10 PDFs batch: ~$0.10-0.50

---

## ✅ Success Criteria

A successful test should show:
- ✅ All files uploaded to Supabase Storage
- ✅ OCR extracted at least vehicle# or load ID
- ✅ At least 1 file matched with journey
- ✅ Variance calculated and displayed
- ✅ Can accept/reject charges individually
- ✅ Comments can be added
- ✅ Overall decision saves to database
- ✅ No errors in console

---

## 🚀 Next Steps After Testing

1. **Fine-tune OCR prompts** based on your PDF formats
2. **Adjust matching thresholds** if needed
3. **Add more charge types** if your invoices have them
4. **Deploy to Vercel** for production use
5. **Enable authentication** for multi-user support

---

**Ready to test? Upload some real PDFs and see the magic happen! ✨**

If you encounter any issues, check the browser console and terminal for error messages.

