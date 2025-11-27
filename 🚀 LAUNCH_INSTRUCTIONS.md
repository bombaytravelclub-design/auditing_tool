# 🚀 Launch Freight Audit Backend Locally

## Status: ✅ Dependencies Installed

---

## Quick Launch (Choose One)

### Option 1: Launch Frontend Only (Vite Dev Server)

This runs the React frontend from the cloned repo:

```bash
cd /Users/admin/Desktop/freight-audit-backend
npm run dev
```

**Access:** http://localhost:5173

**What you get:** The frontend UI (BulkUploadWorkflow, PODReviewWorkspace)

**Note:** Backend API endpoints won't work yet (need Vercel dev server)

---

### Option 2: Launch Backend API (Vercel Dev Server)

This runs the serverless API functions:

```bash
cd /Users/admin/Desktop/freight-audit-backend
npm install -g vercel  # First time only
vercel dev
```

**Access:** http://localhost:3000

**What you get:** API endpoints at /api/*

**Requirements:** 
- Supabase project setup
- OpenAI API key
- Environment variables configured

---

### Option 3: Launch Both (Recommended)

**Terminal 1 - Backend:**
```bash
cd /Users/admin/Desktop/freight-audit-backend
vercel dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/admin/Desktop/freight-audit-backend
npm run dev
```

Then configure frontend to call backend at `http://localhost:3000`

---

## ⚙️ Before Launching Backend API

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor**
4. Copy contents of `supabase/schema.sql`
5. Run the SQL
6. Go to **Settings → API** and copy:
   - Project URL
   - Service role key (under "Project API keys")

### 2. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to API keys
3. Create new key

### 3. Configure Environment

Edit `.env.local`:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-proj-xxx...your-api-key
```

---

## 🧪 Test After Launch

### Test Frontend
```bash
# Should see the UI
curl http://localhost:5173
```

### Test Backend API
```bash
# Should return JSON (empty list initially)
curl http://localhost:3000/api/proformas
```

Expected response:
```json
{"data":[],"total":0,"page":1,"limit":50}
```

---

## 🎯 What's Working Right Now

### Frontend (Vite)
✅ React app loads
✅ UI components render
✅ BulkUploadWorkflow component
✅ PODReviewWorkspace component
⚠️ API calls won't work (need backend running)

### Backend (Vercel)
✅ GET /api/proformas endpoint
⚠️ Other endpoints need implementation
⚠️ Requires API keys configured

---

## 🔧 Troubleshooting

### "Cannot find module @supabase/supabase-js"
```bash
npm install
```

### "SUPABASE_URL is required"
You need to configure `.env.local` with your Supabase credentials.

### "Port 3000 already in use"
Kill the process:
```bash
lsof -ti:3000 | xargs kill -9
```

Or use a different port:
```bash
vercel dev --listen 3001
```

### "Port 5173 already in use"
Kill the process:
```bash
lsof -ti:5173 | xargs kill -9
```

---

## 📚 Next Steps

1. **Just want to see the UI?**
   → Run `npm run dev` (frontend only)

2. **Want to test API?**
   → Set up Supabase + OpenAI keys
   → Run `vercel dev` (backend only)
   → Test with: `curl http://localhost:3000/api/proformas`

3. **Want full integration?**
   → Set up both
   → Configure frontend to call backend
   → Implement remaining API endpoints

---

## 🎨 Current Project Structure

```
Frontend: Vite + React (port 5173)
├── BulkUploadWorkflow.tsx
├── PODReviewWorkspace.tsx
└── UI components (shadcn/ui)

Backend: Vercel Serverless (port 3000)
├── /api/proformas ✅
├── /api/pod/bulk-upload 🚧
├── /api/invoice/bulk-upload 🚧
├── /api/bulk-jobs/[jobId] 🚧
└── More... 🚧
```

---

## ⚡ Quick Commands

```bash
# Frontend only
npm run dev

# Backend only (after configuring .env.local)
vercel dev

# Install Vercel CLI globally
npm install -g vercel

# Check what's running
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
```

---

## ✅ Summary

**To launch frontend:** `npm run dev` → http://localhost:5173  
**To launch backend:** `vercel dev` → http://localhost:3000

**Backend requires:**
- Supabase project + credentials
- OpenAI API key
- Configured .env.local

**Frontend works standalone** but API calls need backend running.

---

**Choose your path and start coding! 🚀**


