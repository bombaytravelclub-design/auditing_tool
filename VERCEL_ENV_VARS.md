# Vercel Environment Variables

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### 1. Supabase Configuration
- **SUPABASE_URL**
  - Description: Your Supabase project URL
  - Example: `https://jflpynnmhjpqddseixzj.supabase.co`
  - Where to find: Supabase Dashboard → Project Settings → API → Project URL

- **SUPABASE_SERVICE_ROLE_KEY**
  - Description: Supabase service role key (bypasses RLS)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Where to find: Supabase Dashboard → Project Settings → API → Service Role Key
  - ⚠️ **Important**: Keep this secret! Never expose in client-side code.

### 2. Google Gemini API
- **GEMINI_API_KEY**
  - Description: Google Gemini API key for OCR extraction
  - Example: `AIzaSyAaXldPlOuxWHO8U2ufW7WwlJ0h9hxVNGg`
  - Where to get: Google AI Studio → Get API Key
  - Used for: Document OCR (POD and Invoice extraction)

### 3. Frontend API URL (Optional)
- **VITE_API_URL**
  - Description: Backend API base URL for frontend
  - Default: `http://localhost:3000` (development)
  - Production: Set to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
  - Note: In production, this should be your Vercel API URL

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: Variable name (e.g., `SUPABASE_URL`)
   - **Value**: Your actual value
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application

## Environment Variable Summary

| Variable Name | Required | Used In | Description |
|--------------|----------|---------|-------------|
| `SUPABASE_URL` | ✅ Yes | Backend API | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Backend API | Supabase service role key |
| `GEMINI_API_KEY` | ✅ Yes | Backend API | Google Gemini API key for OCR |
| `VITE_API_URL` | ⚠️ Optional | Frontend | API base URL (auto-detected in production) |

## Notes

- All backend environment variables (`SUPABASE_*`, `GEMINI_API_KEY`) are only used in serverless functions (`/api/*`)
- Frontend variables (`VITE_*`) are exposed to the browser, so never put secrets there
- After adding environment variables, Vercel will automatically redeploy
- You can verify variables are set correctly by checking the function logs in Vercel dashboard
