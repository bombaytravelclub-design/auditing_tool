// Setup Supabase Storage Buckets
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorageBuckets() {
  console.log('Setting up Supabase Storage buckets...\n');

  try {
    // Create documents bucket
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const documentsBucketExists = existingBuckets?.some(b => b.name === 'documents');

    if (!documentsBucketExists) {
      const { data, error } = await supabase.storage.createBucket('documents', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
      });

      if (error) {
        console.error('Error creating documents bucket:', error);
      } else {
        console.log('✅ Created "documents" bucket');
      }
    } else {
      console.log('✅ "documents" bucket already exists');
    }

    console.log('\n✅ Storage setup complete!');
    console.log('\nBucket structure:');
    console.log('  documents/');
    console.log('    ├── pod/        (POD uploads)');
    console.log('    └── invoices/   (Invoice uploads)');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupStorageBuckets();

