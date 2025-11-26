#!/usr/bin/env node
/**
 * Seed dummy data for Freight Audit System
 * Creates realistic sample transactions in Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Sample data arrays
const TRANSPORTERS = [
  'SwiftLine Logistics',
  'BLR Logistics',
  'ABC Transporters',
  'XYZ Logistics',
  'RapidMove Express',
  'SecureFreight Co',
  'Highway Masters',
  'TransIndia Services',
  'SpeedyGo Logistics',
  'GlobalFreight Partners'
];

const ORIGINS = [
  'Mumbai, MH',
  'Delhi, DL',
  'Bangalore, KA',
  'Chennai, TN',
  'Hyderabad, TG',
  'Pune, MH',
  'Ahmedabad, GJ',
  'Kolkata, WB',
  'Jaipur, RJ',
  'Lucknow, UP'
];

const DESTINATIONS = [
  'Hyderabad, TG',
  'Chennai, TN',
  'Bangalore, KA',
  'Mumbai, MH',
  'Delhi, DL',
  'Pune, MH',
  'Kolkata, WB',
  'Ahmedabad, GJ',
  'Surat, GJ',
  'Indore, MP'
];

const VEHICLE_PREFIXES = ['TN', 'MH', 'KA', 'DL', 'GJ', 'RJ', 'UP', 'AP', 'WB', 'HR'];

const JOURNEY_STATUSES = ['ongoing', 'closed', 'disputed'];
const EPOD_STATUSES = ['pending', 'approved', 'rejected'];

// Helper functions
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateVehicleNo() {
  const prefix = randomItem(VEHICLE_PREFIXES);
  const num1 = randomNumber(10, 99);
  const letters = String.fromCharCode(65 + randomNumber(0, 25)) + String.fromCharCode(65 + randomNumber(0, 25));
  const num2 = randomNumber(1000, 9999);
  return `${prefix}${num1}${letters}${num2}`;
}

function generateLCUNo() {
  return `LCU${randomNumber(10000000, 99999999)}`;
}

function generateJourneyNo() {
  return `JY${new Date().getFullYear()}${String(randomNumber(100000, 999999)).padStart(6, '0')}`;
}

function generateProformaNo() {
  return `PF${new Date().getFullYear()}${String(randomNumber(100000, 999999)).padStart(6, '0')}`;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString();
}

function formatDateOnly(date) {
  return date.toISOString().split('T')[0];
}

// Generate data
async function generateUsers() {
  console.log('📝 Creating users...');
  
  const users = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'consignor@freightaudit.com',
      full_name: 'Acme Corporation',
      role: 'consignor',
      company_id: 'ACME-CORP',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'transporter@freightaudit.com',
      full_name: 'Global Logistics Inc',
      role: 'transporter',
      company_id: 'GLOBAL-LOG',
    }
  ];

  const { data, error } = await supabase
    .from('users')
    .upsert(users, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error creating users:', error);
  } else {
    console.log(`✅ Created ${users.length} users`);
  }

  return users;
}

async function generateJourneys(count = 150) {
  console.log(`📝 Creating ${count} journeys...`);
  
  const journeys = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (let i = 0; i < count; i++) {
    const journeyDate = randomDate(sixMonthsAgo, now);
    const deliveryDays = randomNumber(1, 7);
    const closureDate = new Date(journeyDate);
    closureDate.setDate(closureDate.getDate() + deliveryDays);
    
    const status = randomItem(JOURNEY_STATUSES);
    
    // Set ePOD status based on journey status
    let epodStatus;
    if (status === 'closed') {
      epodStatus = randomItem(['approved', 'pending']);
    } else if (status === 'disputed') {
      // Split disputed journeys across 3 sub-categories
      const disputeType = randomNumber(1, 3);
      if (disputeType === 1) {
        epodStatus = 'rejected'; // Will map to "Rejected" tab
      } else if (disputeType === 2) {
        epodStatus = 'pending'; // Will map to "Review Pending" tab
      } else {
        epodStatus = 'approved'; // Will map to "Re-Upload Supporting Doc" tab
      }
    } else {
      epodStatus = 'pending';
    }
    const hasClosed = status !== 'ongoing';

    journeys.push({
      journey_number: generateJourneyNo(),
      vehicle_number: generateVehicleNo(),
      load_id: generateLCUNo(),
      consignor_id: '00000000-0000-0000-0000-000000000001',
      transporter_id: '00000000-0000-0000-0000-000000000002',
      origin: randomItem(ORIGINS),
      destination: randomItem(DESTINATIONS),
      status: status,
      epod_status: epodStatus,
      journey_date: formatDateOnly(journeyDate),
      closure_date: hasClosed ? formatDate(closureDate) : null,
      created_by: '00000000-0000-0000-0000-000000000001',
    });
  }

  const { data, error } = await supabase
    .from('journeys')
    .insert(journeys)
    .select();

  if (error) {
    console.error('❌ Error creating journeys:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} journeys`);
  return data;
}

async function generateProformas(journeys) {
  console.log('📝 Creating proformas...');
  
  const proformas = [];

  // Create proformas for ALL journeys (ongoing, closed, disputed)
  const journeysForProforma = journeys;

  for (const journey of journeysForProforma) {
    const baseFreight = randomFloat(30000, 150000, 2);
    const detentionCharge = Math.random() > 0.7 ? randomFloat(2000, 10000, 2) : 0;
    const tollCharge = randomFloat(500, 3000, 2);
    const unloadingCharge = randomFloat(1000, 5000, 2);
    const otherCharges = Math.random() > 0.8 ? randomFloat(500, 2000, 2) : 0;
    const subtotal = baseFreight + detentionCharge + tollCharge + unloadingCharge + otherCharges;
    const gstAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + gstAmount;

    // Set category and invoice_matched based on journey status
    let category, invoiceMatched;
    if (journey.status === 'ongoing') {
      category = 'open';
      invoiceMatched = false;
    } else if (journey.status === 'disputed') {
      category = 'disputed';
      invoiceMatched = Math.random() > 0.5;
    } else {
      category = 'open';
      invoiceMatched = Math.random() > 0.6;
    }

    proformas.push({
      proforma_number: generateProformaNo(),
      journey_id: journey.id,
      consignor_id: journey.consignor_id,
      transporter_id: journey.transporter_id,
      base_freight: baseFreight,
      detention_charge: detentionCharge,
      toll_charge: tollCharge,
      unloading_charge: unloadingCharge,
      other_charges: otherCharges,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      category: category,
      invoice_matched: invoiceMatched,
      generated_at: journey.closure_date || formatDate(new Date()),
      created_by: '00000000-0000-0000-0000-000000000001',
    });
  }

  if (proformas.length === 0) {
    console.log('⚠️  No journeys available for proformas');
    return [];
  }

  const { data, error } = await supabase
    .from('proformas')
    .insert(proformas)
    .select();

  if (error) {
    console.error('❌ Error creating proformas:', error);
    return [];
  }

  console.log(`✅ Created ${data.length} proformas`);
  return data;
}

async function generatePODDocuments(journeys) {
  console.log('📝 Creating POD documents...');
  
  const pods = [];
  
  // Create PODs for closed journeys
  const closedJourneys = journeys.filter(j => j.status === 'closed');
  
  for (const journey of closedJourneys) {
    const confidence = randomFloat(0.85, 0.99, 4);
    
    pods.push({
      journey_id: journey.id,
      storage_path: `pods/${journey.journey_number}_POD.pdf`,
      file_name: `${journey.journey_number}_POD.pdf`,
      file_size: randomNumber(100000, 5000000),
      mime_type: 'application/pdf',
      ocr_vehicle_number: journey.vehicle_number,
      ocr_load_id: journey.load_id,
      ocr_journey_number: journey.journey_number,
      ocr_confidence: confidence,
      ocr_raw_response: {
        vehicle: journey.vehicle_number,
        loadId: journey.load_id,
        journeyNumber: journey.journey_number,
        deliveryDate: journey.closure_date,
        confidence: confidence
      },
      is_verified: Math.random() > 0.3,
      verification_status: randomItem(['matched', 'mismatch', 'needs_review']),
      uploaded_by: '00000000-0000-0000-0000-000000000001',
      uploaded_at: journey.closure_date,
    });
  }

  if (pods.length > 0) {
    const { data, error } = await supabase
      .from('pod_documents')
      .insert(pods)
      .select();

    if (error) {
      console.error('❌ Error creating POD documents:', error);
      return [];
    }

    console.log(`✅ Created ${data.length} POD documents`);
    return data;
  }

  return [];
}

async function generateInvoiceDocuments(proformas) {
  console.log('📝 Creating invoice documents...');
  
  const invoices = [];
  
  // Create invoices for 50% of proformas
  const proformasWithInvoices = proformas.filter(() => Math.random() > 0.5);
  
  for (const proforma of proformasWithInvoices) {
    const confidence = randomFloat(0.85, 0.99, 4);
    const invoiceDate = new Date(proforma.generated_at);
    
    // Add slight variations to simulate real-world mismatches
    const hasVariance = Math.random() > 0.7;
    const variancePercent = hasVariance ? randomFloat(-0.05, 0.05, 2) : 0;
    
    const ocrBaseFreight = proforma.base_freight * (1 + variancePercent);
    const ocrTotal = proforma.total_amount * (1 + variancePercent);
    
    invoices.push({
      proforma_id: proforma.id,
      journey_id: proforma.journey_id,
      invoice_number: `INV${randomNumber(100000, 999999)}`,
      invoice_date: formatDateOnly(invoiceDate),
      storage_path: `invoices/${proforma.proforma_number}_INVOICE.pdf`,
      file_name: `${proforma.proforma_number}_INVOICE.pdf`,
      file_size: randomNumber(100000, 5000000),
      mime_type: 'application/pdf',
      ocr_base_freight: ocrBaseFreight,
      ocr_detention_charge: proforma.detention_charge,
      ocr_toll_charge: proforma.toll_charge,
      ocr_unloading_charge: proforma.unloading_charge,
      ocr_other_charges: proforma.other_charges,
      ocr_gst_amount: proforma.gst_amount,
      ocr_total_amount: ocrTotal,
      ocr_confidence: confidence,
      ocr_raw_response: {
        invoiceNumber: `INV${randomNumber(100000, 999999)}`,
        invoiceDate: proforma.generated_at,
        baseFreight: ocrBaseFreight,
        totalAmount: ocrTotal,
        confidence: confidence
      },
      variance_base_freight: ocrBaseFreight - proforma.base_freight,
      variance_total: ocrTotal - proforma.total_amount,
      match_status: hasVariance ? 'partial_match' : 'exact_match',
      uploaded_by: '00000000-0000-0000-0000-000000000002',
      uploaded_at: proforma.generated_at,
    });
  }

  if (invoices.length > 0) {
    const { data, error} = await supabase
      .from('invoice_documents')
      .insert(invoices)
      .select();

    if (error) {
      console.error('❌ Error creating invoice documents:', error);
      return [];
    }

    console.log(`✅ Created ${data.length} invoice documents`);
    return data;
  }

  return [];
}

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await supabase.from('review_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bulk_job_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bulk_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('invoice_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('pod_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('proformas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('journeys').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Cleared existing data\n');

    // Generate all data
    await generateUsers();
    const journeys = await generateJourneys(150);
    const proformas = await generateProformas(journeys);
    await generatePODDocuments(journeys);
    await generateInvoiceDocuments(proformas);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: 2`);
    console.log(`   - Journeys: ${journeys.length}`);
    console.log(`   - Proformas: ${proformas.length}`);
    console.log(`   - POD Documents: ${journeys.filter(j => j.status === 'closed').length}`);
    console.log(`   - Invoice Documents: ~${Math.floor(proformas.length * 0.5)}`);
    console.log('\n🌐 Test the API:');
    console.log(`   curl http://localhost:3000/api/proformas`);
    console.log('\n🎨 View in browser:');
    console.log(`   http://localhost:5174\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
