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

const MATERIALS = [
  { name: 'Refined Oil', weight: 2500, quantity: 500 },
  { name: 'Steel Coils', weight: 5000, quantity: 100 },
  { name: 'Electronics', weight: 1200, quantity: 800 },
  { name: 'Textiles', weight: 3000, quantity: 1500 },
  { name: 'Pharmaceuticals', weight: 800, quantity: 2000 },
  { name: 'Auto Parts', weight: 2000, quantity: 600 },
  { name: 'Food Grains', weight: 10000, quantity: 10000 },
  { name: 'Chemicals', weight: 4000, quantity: 400 },
  { name: 'Machinery', weight: 6000, quantity: 50 },
  { name: 'Consumer Goods', weight: 1500, quantity: 1200 }
];

const VEHICLE_PREFIXES = ['TN', 'MH', 'KA', 'DL', 'GJ', 'RJ', 'UP', 'AP', 'WB', 'HR'];

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
  return `${randomNumber(10000000, 99999999)}${randomNumber(100000, 999999)}`;
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

// Generate data
async function generateUsers() {
  console.log('📝 Creating users...');
  
  const users = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'consignor@example.com',
      name: 'Acme Corporation',
      role: 'consignor',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'transporter@example.com',
      name: 'Global Logistics Inc',
      role: 'transporter',
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

async function generateJourneys(count = 100) {
  console.log(`📝 Creating ${count} journeys...`);
  
  const journeys = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (let i = 0; i < count; i++) {
    const material = randomItem(MATERIALS);
    const pickupDate = randomDate(sixMonthsAgo, now);
    const deliveryDays = randomNumber(1, 7);
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    const epodStatus = randomItem(EPOD_STATUSES);
    const hasDelivered = epodStatus !== 'pending' || Math.random() > 0.3;

    journeys.push({
      journey_no: generateJourneyNo(),
      vehicle_no: generateVehicleNo(),
      load_id: generateLCUNo(),
      consignor_id: '00000000-0000-0000-0000-000000000001',
      transporter_id: '00000000-0000-0000-0000-000000000002',
      origin: randomItem(ORIGINS),
      destination: randomItem(DESTINATIONS),
      material_name: material.name,
      quantity: material.quantity + randomNumber(-100, 100),
      weight: material.weight + randomNumber(-200, 200),
      pickup_date: formatDate(pickupDate),
      delivery_date: hasDelivered ? formatDate(deliveryDate) : null,
      epod_status: epodStatus,
      epod_approved_at: epodStatus === 'approved' ? formatDate(deliveryDate) : null,
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
  const categories = ['freight', 'detention', 'other'];

  for (const journey of journeys) {
    // Generate 1-3 proformas per journey
    const numProformas = randomNumber(1, 2);
    
    for (let i = 0; i < numProformas; i++) {
      const baseCharge = randomFloat(30000, 150000, 2);
      const additionalCharges = randomFloat(0, baseCharge * 0.2, 2);
      const penalty = Math.random() > 0.8 ? -randomFloat(1000, 5000, 2) : 0;
      const totalAmount = baseCharge + additionalCharges + penalty;

      proformas.push({
        proforma_no: generateProformaNo(),
        journey_id: journey.id,
        consignor_id: journey.consignor_id,
        transporter_id: journey.transporter_id,
        category: i === 0 ? 'freight' : randomItem(categories),
        base_freight_charge: baseCharge,
        additional_charges: additionalCharges,
        penalty_adjustments: penalty,
        total_amount: totalAmount,
        generated_at: journey.delivery_date || journey.pickup_date,
      });
    }
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
  
  // Create PODs for delivered journeys
  const deliveredJourneys = journeys.filter(j => j.delivery_date);
  
  for (const journey of deliveredJourneys.slice(0, 50)) {
    pods.push({
      journey_id: journey.id,
      file_path: `pods/${journey.journey_no}_POD.pdf`,
      file_name: `${journey.journey_no}_POD.pdf`,
      uploaded_by: '00000000-0000-0000-0000-000000000001',
      extracted_metadata: {
        vehicle: journey.vehicle_no,
        loadId: journey.load_id,
        journeyNo: journey.journey_no,
        deliveryDate: journey.delivery_date,
        confidence: randomFloat(0.85, 0.99, 2)
      },
      ocr_confidence: randomFloat(0.85, 0.99, 2),
      uploaded_at: journey.delivery_date,
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
  
  // Create invoices for 40% of proformas
  const proformasWithInvoices = proformas.slice(0, Math.floor(proformas.length * 0.4));
  
  for (const proforma of proformasWithInvoices) {
    invoices.push({
      proforma_id: proforma.id,
      file_path: `invoices/${proforma.proforma_no}_INVOICE.pdf`,
      file_name: `${proforma.proforma_no}_INVOICE.pdf`,
      uploaded_by: '00000000-0000-0000-0000-000000000002',
      extracted_data: {
        invoiceNo: `INV${randomNumber(100000, 999999)}`,
        invoiceDate: proforma.generated_at,
        baseFreightCharge: proforma.base_freight_charge,
        additionalCharges: proforma.additional_charges,
        totalAmount: proforma.total_amount,
        confidence: randomFloat(0.85, 0.99, 2)
      },
      ocr_confidence: randomFloat(0.85, 0.99, 2),
      uploaded_at: proforma.generated_at,
    });
  }

  if (invoices.length > 0) {
    const { data, error } = await supabase
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
    // Clear existing data (optional)
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
    const journeys = await generateJourneys(100);
    const proformas = await generateProformas(journeys);
    await generatePODDocuments(journeys);
    await generateInvoiceDocuments(proformas);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: 2`);
    console.log(`   - Journeys: ${journeys.length}`);
    console.log(`   - Proformas: ${proformas.length}`);
    console.log(`   - POD Documents: ~50`);
    console.log(`   - Invoice Documents: ~${Math.floor(proformas.length * 0.4)}`);
    console.log('\n🌐 View at: http://localhost:5174\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();

