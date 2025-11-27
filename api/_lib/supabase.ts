// Supabase client for serverless functions
// Edge-compatible client

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key
// This bypasses RLS and gives full access (needed for serverless functions)
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = 'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY';
    console.error('❌', errorMsg);
    console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
    throw new Error(errorMsg);
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return supabaseClient;
}

// Export Supabase client - will throw helpful error if env vars missing
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

// Storage bucket names
export const STORAGE_BUCKETS = {
  POD_DOCUMENTS: 'pod-documents',
  INVOICE_DOCUMENTS: 'invoice-documents',
} as const;

// Helper to initialize storage buckets
export async function initializeStorageBuckets() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketNames = buckets?.map(b => b.name) || [];

    // Create POD bucket if it doesn't exist
    if (!bucketNames.includes(STORAGE_BUCKETS.POD_DOCUMENTS)) {
      await supabase.storage.createBucket(STORAGE_BUCKETS.POD_DOCUMENTS, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
    }

    // Create Invoice bucket if it doesn't exist
    if (!bucketNames.includes(STORAGE_BUCKETS.INVOICE_DOCUMENTS)) {
      await supabase.storage.createBucket(STORAGE_BUCKETS.INVOICE_DOCUMENTS, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    return { success: false, error };
  }
}

// Helper to upload file to storage
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data;
}

// Helper to get signed URL for file
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}


