# Fix Storage RLS Policy Error

## Error
```
StorageApiError: new row violates row-level security policy
status: 400, statusCode: '403'
```

## Problem
The Supabase Storage bucket `documents` has Row-Level Security (RLS) policies enabled that are blocking file uploads, even when using the service role key.

## Solution

### Option 1: Create Storage Policy (Recommended)

1. Go to **Supabase Dashboard** → **Storage**
2. Click on the **`documents`** bucket
3. Go to **Policies** tab
4. Click **New Policy**
5. Create a policy with these settings:

**Policy Name:** `Allow service role uploads`

**Policy Definition:**
```sql
CREATE POLICY "Allow service role uploads" ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'documents');
```

**Or use the UI:**
- **Policy name:** `Allow service role uploads`
- **Allowed operation:** `INSERT`
- **Target roles:** `service_role`
- **Policy definition:** `bucket_id = 'documents'`

### Option 2: Disable RLS on Storage Bucket (Less Secure)

1. Go to **Supabase Dashboard** → **Storage**
2. Click on the **`documents`** bucket
3. Go to **Settings** tab
4. Find **Row Level Security** section
5. Toggle **RLS** to **OFF**

⚠️ **Warning:** This disables RLS for all operations on this bucket. Only do this if you trust all users/applications that can access this bucket.

### Option 3: Create Public Upload Policy (For Public Buckets)

If you want to allow public uploads:

```sql
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');
```

## Verify Fix

After applying the policy, try uploading a file again. The upload should succeed.

## Additional Notes

- The service role key should bypass RLS, but Storage buckets have separate policies
- Storage policies are evaluated separately from table RLS policies
- Make sure you're using the correct bucket name (`documents`)
- Check that the file path format is correct: `invoice/filename.jpg` or `pod/filename.jpg`

