# 🚀 Freight Audit Backend - Quick Start

## What You Have

✅ **Complete database schema** (8 tables, production-ready)  
✅ **TypeScript types** (full domain coverage)  
✅ **GPT-4o OCR system** (POD + Invoice extraction)  
✅ **Supabase integration** (database + storage)  
✅ **API template** (1 endpoint complete, 5 templates ready)  
✅ **Deployment config** (vercel.json + env template)  

**Location:** `/Users/admin/Desktop/freight-audit-backend/`

---

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
cd "/Users/admin/Desktop/freight-audit-backend"

npm install @supabase/supabase-js @vercel/node openai formidable
npm install -D typescript @types/node @types/formidable
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create project
2. Copy your project URL and service role key
3. Go to SQL Editor → Paste contents of `supabase/schema.sql` → Run
4. Verify tables created: Check Table Editor

### Step 3: Configure Environment

```bash
cp .env.local.example .env.local

# Edit .env.local:
# - Add your SUPABASE_URL
# - Add your SUPABASE_SERVICE_ROLE_KEY
# - Add your OPENAI_API_KEY
```

### Step 4: Test Locally

```bash
# Install Vercel CLI
npm install -g vercel

# Run dev server
vercel dev
```

Visit: `http://localhost:3000/api/proformas`  
You should see: `{"data":[],"total":0,"page":1,"limit":50}`

✅ **Backend is running!**

---

## What's Already Built

### 📂 File Structure

```
freight-audit-backend/
├── api/                                    # Serverless functions
│   ├── _lib/
│   │   ├── supabase.ts                    # ✅ Supabase client
│   │   └── ocr.ts                         # ✅ GPT-4o OCR helpers
│   └── proformas.ts                       # ✅ List proformas API
│
├── supabase/
│   └── schema.sql                         # ✅ Complete DB schema
│
├── src/
│   ├── api/                               # Frontend integration (empty)
│   └── types/
│       └── domain.ts                      # ✅ TypeScript types
│
├── .env.local.example                     # ✅ Environment template
├── vercel.json                            # ✅ Deployment config
├── README_BACKEND.md                      # ✅ Full documentation
├── IMPLEMENTATION_COMPLETE.md             # ✅ Implementation guide
└── QUICK_START_BACKEND.md                # ✅ This file
```

### ✅ What Works Right Now

1. **Database Schema**
   - 8 tables with relationships
   - Indexes for performance
   - Auto-updating timestamps
   - Future-proof for multi-role

2. **OCR System**
   ```typescript
   // POD extraction
   const result = await extractPodMetadata(fileBuffer, mimeType);
   // Returns: { journeyNumber, vehicleNumber, loadId, confidence }
   
   // Invoice extraction
   const result = await extractInvoiceMetadata(fileBuffer, mimeType);
   // Returns: { invoiceNumber, baseFreight, gstAmount, totalAmount, ... }
   ```

3. **Matching Algorithms**
   ```typescript
   // Match POD with Journey
   const match = matchPodWithJourney(ocrResult, journey);
   // Returns: { isMatch, status, matchScore, details }
   
   // Match Invoice with Proforma + calculate variances
   const match = matchInvoiceWithProforma(ocrResult, proforma);
   // Returns: { isMatch, matchStatus, variances, variancePercentage }
   ```

4. **API Endpoint**
   - `GET /api/proformas` - List proformas with filters
   - Supports pagination, category filter, ePOD status filter

---

## Next Steps (Complete API)

### 5 Endpoints to Implement

The hard work is done! Now just implement these endpoints using the templates:

#### 1. POST /api/pod/bulk-upload

**Template:**
```typescript
// api/pod/bulk-upload.ts
import { supabase, uploadToStorage, STORAGE_BUCKETS } from '../_lib/supabase';
import { extractPodMetadata, matchPodWithJourney } from '../_lib/ocr';
import { MOCK_CONSIGNOR_ID } from '../../src/types/domain';
import formidable from 'formidable';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // 1. Parse form data
  const form = formidable({ multiples: true });
  const [fields, files] = await form.parse(req);
  const journeyIds = JSON.parse(fields.journeyIds);
  
  // 2. Create bulk job
  const { data: job } = await supabase
    .from('bulk_jobs')
    .insert({ job_type: 'pod', total_files: files.length, uploaded_by: MOCK_CONSIGNOR_ID })
    .select()
    .single();
  
  // 3. Process each file
  for (const file of files) {
    // Upload to storage
    const fileBuffer = await fs.readFile(file.filepath);
    await uploadToStorage(STORAGE_BUCKETS.POD_DOCUMENTS, `${jobId}/${file.name}`, fileBuffer, file.mimetype);
    
    // OCR extraction
    const ocrResult = await extractPodMetadata(fileBuffer, file.mimetype);
    
    // Match with journey
    const journey = await getJourneyById(journeyIds[0]); // Implement getJourneyById
    const matchResult = matchPodWithJourney(ocrResult, journey);
    
    // Save document
    const { data: podDoc } = await supabase.from('pod_documents').insert({...}).select().single();
    
    // Create job item
    await supabase.from('bulk_job_items').insert({
      bulk_job_id: job.id,
      journey_id: journey.id,
      pod_document_id: podDoc.id,
      match_status: matchResult.status,
      ...
    });
  }
  
  // 4. Update job status
  await supabase.from('bulk_jobs').update({ status: 'completed' }).eq('id', job.id);
  
  return res.json({ jobId: job.id, message: 'Upload complete' });
}
```

#### 2. POST /api/invoice/bulk-upload
Similar to POD upload but for invoices

#### 3. GET /api/bulk-jobs/[jobId]
```typescript
// api/bulk-jobs/[jobId].ts
export default async function handler(req, res) {
  const { jobId } = req.query;
  
  const { data } = await supabase
    .from('bulk_jobs')
    .select('*, items:bulk_job_items(*)')
    .eq('id', jobId)
    .single();
  
  return res.json(data);
}
```

#### 4. GET /api/bulk-jobs/[jobId]/items/[itemId]
Similar to above but with more joins

#### 5. POST /api/review-actions
```typescript
export default async function handler(req, res) {
  const { jobItemId, action, comment } = req.body;
  
  // 1. Update item status
  await supabase.from('bulk_job_items')
    .update({ match_status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', jobItemId);
  
  // 2. Record action (audit trail)
  await supabase.from('review_actions').insert({
    bulk_job_item_id: jobItemId,
    action,
    comment,
    performed_by: MOCK_CONSIGNOR_ID,
    ...
  });
  
  return res.json({ success: true });
}
```

---

## Testing Guide

### 1. Add Test Data

```sql
-- Run in Supabase SQL Editor
INSERT INTO users (id, email, role, full_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'consignor', 'Test User');

INSERT INTO journeys (id, journey_number, vehicle_number, status, epod_status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'JRN-001', 'MH12AB1234', 'closed', 'approved');

INSERT INTO proformas (id, proforma_number, journey_id, base_freight, total_amount, category) VALUES
  ('22222222-2222-2222-2222-222222222222', 'PFM-001', '11111111-1111-1111-1111-111111111111', 10000, 12000, 'closed');
```

### 2. Test API

```bash
# List proformas
curl http://localhost:3000/api/proformas

# Upload POD (once implemented)
curl -X POST http://localhost:3000/api/pod/bulk-upload \
  -F 'journeyIds=["11111111-1111-1111-1111-111111111111"]' \
  -F 'files=@test-pod.pdf'

# Check job status
curl http://localhost:3000/api/bulk-jobs/[jobId]
```

---

## Deploy to Production

```bash
# 1. Connect to Vercel
vercel

# 2. Add environment variables in Vercel dashboard:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY

# 3. Deploy
vercel --prod
```

---

## Frontend Integration

Create `src/api/proformas.ts`:

```typescript
import type { ProformaListResponse } from '../types/domain';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function getProformas(filters?: {
  category?: string;
  epodStatus?: string;
  page?: number;
}) {
  const params = new URLSearchParams(filters as any);
  const response = await fetch(`${API_BASE}/api/proformas?${params}`);
  return response.json() as Promise<ProformaListResponse>;
}

export async function uploadPodDocuments(journeyIds: string[], files: File[]) {
  const formData = new FormData();
  formData.append('journeyIds', JSON.stringify(journeyIds));
  files.forEach(file => formData.append('files', file));
  
  const response = await fetch(`${API_BASE}/api/pod/bulk-upload`, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}

// Add more functions for other endpoints...
```

Use in React components:

```typescript
import { getProformas } from '../api/proformas';

function ProformaList() {
  const [proformas, setProformas] = useState([]);
  
  useEffect(() => {
    getProformas({ category: 'closed' })
      .then(data => setProformas(data.data));
  }, []);
  
  return <div>{/* Render proformas */}</div>;
}
```

---

## Common Issues

### CORS Errors
Already configured in `vercel.json` ✅

### OCR Timeout
Already configured (300s max duration) ✅

### Storage Bucket Missing
Run once:
```typescript
import { initializeStorageBuckets } from './api/_lib/supabase';
await initializeStorageBuckets();
```

---

## Summary

**✅ Ready to Use:**
- Database (8 tables)
- OCR System (GPT-4o)
- Matching Logic
- Types
- 1 API endpoint

**🚧 To Complete (4-6 hours):**
- 5 API endpoints (templates provided)
- Frontend integration layer
- Testing

**📚 Documentation:**
- `README_BACKEND.md` - Full guide
- `IMPLEMENTATION_COMPLETE.md` - Architecture details
- `QUICK_START_BACKEND.md` - This file

---

**🎉 You're 80% done! The hard infrastructure work is complete.**  
**Next: Implement the 5 API endpoints using the templates above.**

Questions? Check `README_BACKEND.md` for detailed implementation guide.

