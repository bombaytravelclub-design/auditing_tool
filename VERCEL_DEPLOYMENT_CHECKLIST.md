# Vercel Deployment Checklist - "Failed to Load" Fix

## Common Issues and Solutions

### 1. ✅ Environment Variables Not Set
**Check in Vercel Dashboard → Settings → Environment Variables:**

Required variables:
- `OPENAI_API_KEY` ✅ (You have this)
- `SUPABASE_URL` ✅ (Check if set)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (Check if set)

**Action:** Verify all three are set for Production, Preview, and Development environments.

### 2. ✅ API Routes Using Wrong OCR Engine
**Problem:** `/api/bulk-upload.ts` still uses Gemini, but code expects OpenAI.

**Fix:** The API routes need to be updated to use OpenAI instead of Gemini.

### 3. ✅ Frontend API URL Issue
**Fixed:** Frontend now auto-detects Vercel domain (committed in latest push).

### 4. ✅ Check Vercel Function Logs
**Steps:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to "Functions" tab
4. Check logs for errors

**Common errors:**
- `Missing OPENAI_API_KEY` → Set environment variable
- `Missing Supabase credentials` → Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- `Module not found: openai` → Need to add `openai` package

### 5. ✅ Verify API Endpoints Work
Test these URLs (replace with your Vercel URL):
- `https://your-app.vercel.app/api/proformas` → Should return JSON
- `https://your-app.vercel.app/health` → Should return `{"status":"ok"}`
- `https://your-app.vercel.app/api/bulk-upload` → Should return method not allowed (GET) or accept POST

### 6. ✅ Check Browser Console
**On the failing device:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - `Failed to fetch`
   - `NetworkError`
   - `CORS error`
   - `404 Not Found`

### 7. ✅ Verify Build Success
**Check Vercel deployment:**
- Build should complete successfully
- No build errors in logs
- Functions should be deployed

## Quick Fix Steps

1. **Verify Environment Variables:**
   ```bash
   # In Vercel Dashboard, check:
   - OPENAI_API_KEY is set
   - SUPABASE_URL is set  
   - SUPABASE_SERVICE_ROLE_KEY is set
   ```

2. **Redeploy:**
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment
   - Or push a new commit

3. **Test API:**
   ```bash
   curl https://your-app.vercel.app/health
   ```

4. **Check Function Logs:**
   - Vercel Dashboard → Functions → View logs
   - Look for errors during API calls

## Next Steps

The API routes (`/api/bulk-upload.ts`) need to be updated to use OpenAI instead of Gemini. This is a critical fix that needs to be done.

