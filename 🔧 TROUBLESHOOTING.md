# 🔧 Troubleshooting - Backend Not Working

## Current Status

✅ **Frontend**: Working on http://localhost:5174  
❌ **Backend**: Not running

## The Problem

The Vercel dev server isn't starting properly in the background. You need to start it manually in a terminal.

---

## ✅ Solution: Manual Start (Recommended)

### Step 1: Open New Terminal Window

Open Terminal app and run:

```bash
cd /Users/admin/Desktop/freight-audit-backend
npx vercel dev --yes
```

### Step 2: Wait for "Ready!" Message

You should see:
```
Vercel CLI X.X.X
> Ready! Available at http://localhost:3000
```

### Step 3: Test It

In another terminal or browser:
```bash
curl http://localhost:3000/api/proformas
```

Should return:
```json
{"data":[],"total":0,"page":1,"limit":50}
```

---

## 🎯 What You'll Have Running

| Service | Port | Status | URL |
|---------|------|--------|-----|
| Frontend | 5174 | ✅ Running | http://localhost:5174 |
| Backend | 3000 | ⏳ Start manually | http://localhost:3000 |

---

## 🔍 Common Issues

### Issue 1: "Vercel not found"

**Solution:**
```bash
npm install -g vercel
# If permission error, use:
sudo npm install -g vercel
```

### Issue 2: "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npx vercel dev --listen 3001 --yes
```

### Issue 3: "OPENAI_API_KEY not found"

**Solution:**
```bash
# Check .env.local exists
cat /Users/admin/Desktop/freight-audit-backend/.env.local

# Should show your API keys
# If not, check BACKEND_SETUP_COMPLETE.txt for keys
```

### Issue 4: Frontend loads but API calls fail

**Problem**: Backend not running  
**Solution**: Start backend as shown above

---

## 🧪 Quick Test

### Test Frontend (Should Work)
```bash
curl http://localhost:5174
# Should return HTML
```

### Test Backend (Needs manual start)
```bash
curl http://localhost:3000/api/proformas
# Should return JSON
```

---

## 🚀 Full Launch Process

**Terminal 1 - Backend:**
```bash
cd /Users/admin/Desktop/freight-audit-backend
npx vercel dev --yes
# Leave this running
```

**Terminal 2 - Frontend (already running):**
```bash
# Already started - available at http://localhost:5174
```

**Browser:**
```bash
# Open both:
open http://localhost:5174  # Frontend UI
open http://localhost:3000/api/proformas  # Backend API test
```

---

## ✅ Verification Checklist

Run these commands to verify setup:

```bash
# 1. Check .env.local exists
ls -la /Users/admin/Desktop/freight-audit-backend/.env.local
# Should show file

# 2. Check if frontend is running
lsof -i :5174
# Should show node process

# 3. Check if backend is running  
lsof -i :3000
# Should show node/vercel process (after you start it)

# 4. Test frontend
curl -s http://localhost:5174 | head -5
# Should show HTML

# 5. Test backend
curl http://localhost:3000/api/proformas
# Should show JSON
```

---

## 📝 What's Actually Working

**✅ Working Now:**
- Dependencies installed
- All API keys configured in .env.local
- Database tables created in Supabase
- Frontend running on port 5174
- Supabase connection ready
- OpenAI API ready

**❌ Not Working:**
- Backend API server (Vercel) - needs manual start

---

## 🎯 Simple Fix

Just run this in a **new terminal window**:

```bash
cd /Users/admin/Desktop/freight-audit-backend && npx vercel dev --yes
```

Leave it running and your backend will be live at **http://localhost:3000**!

---

## 💡 Pro Tip

Create two terminal tabs:
- **Tab 1**: Backend (vercel dev) 
- **Tab 2**: For testing (curl commands)

This way both services run continuously and you can test easily!

---

## ❓ Still Not Working?

Check:
1. Is .env.local file present? `ls .env.local`
2. Does it have all 3 keys? `grep -c "=" .env.local` (should be 3+)
3. Is port 3000 free? `lsof -ti:3000` (should be empty)
4. Do you have npx? `which npx` (should show path)

If all above are OK, try:
```bash
cd /Users/admin/Desktop/freight-audit-backend
rm -rf .vercel
npx vercel dev --yes
```

---

**Ready to start? Open a new terminal and run the vercel dev command!** 🚀


