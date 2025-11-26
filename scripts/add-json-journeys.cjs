// Script to add JSON journeys to database and remove others from ePOD tabs
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const jsonJourneys = [
  {
    "lcuNo": "LCU95304199",
    "lrNo": "LR20257713",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Bangalore", "state": "KA" },
    "destination": { "city": "Surat", "state": "GJ" },
    "pickupDate": "2025-10-09",
    "deliveryDate": "2025-10-12",
    "charges": {
      "baseFreight": 47727.03,
      "addOn": { "toll": 516.75, "unloading": 1052.18, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 2957.76, "cgstAmount": 2957.76 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 47727.03,
      "totalAdditionalCharges": 1568.93,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 2957.76,
      "cgstAmount": 2957.76,
      "totalPayableAmount": 55211.48
    },
    "material": {
      "description": "Industrial chemicals (non-hazardous)",
      "quantityKg": 1764,
      "packageCount": 18,
      "packageType": "Drums"
    },
    "documents": {
      "invoiceNumber": "INV-24001",
      "invoicePdfPath": "/sample-data/invoices/sample_invoice.pdf",
      "epodPdfPath": "/sample-data/epod/sample_epod.pdf"
    }
  },
  {
    "lcuNo": "LCU44201397",
    "lrNo": "LR20251231",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Mumbai", "state": "MH" },
    "destination": { "city": "Ahmedabad", "state": "GJ" },
    "pickupDate": "2025-09-28",
    "deliveryDate": "2025-10-01",
    "charges": {
      "baseFreight": 85195.65,
      "addOn": { "toll": 3892.15, "unloading": 3000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 5525.27, "cgstAmount": 5525.27 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 85195.65,
      "totalAdditionalCharges": 6892.15,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 5525.27,
      "cgstAmount": 5525.27,
      "totalPayableAmount": 103138.34
    },
    "material": {
      "description": "FMCG cartons",
      "quantityKg": 9200,
      "packageCount": 460,
      "packageType": "Cartons"
    },
    "documents": {
      "invoiceNumber": "INV-24002",
      "invoicePdfPath": "/sample-data/invoices/inv-24002.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20251231.pdf"
    }
  },
  {
    "lcuNo": "LCU85015386",
    "lrNo": "LR20253639",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Pune", "state": "MH" },
    "destination": { "city": "Delhi", "state": "DL" },
    "pickupDate": "2025-10-03",
    "deliveryDate": "2025-10-06",
    "charges": {
      "baseFreight": 122728.91,
      "addOn": { "toll": 10578.13, "unloading": 5100, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 8304.42, "cgstAmount": 8304.42 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 122728.91,
      "totalAdditionalCharges": 15678.13,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 8304.42,
      "cgstAmount": 8304.42,
      "totalPayableAmount": 155015.88
    },
    "material": {
      "description": "Automotive spare parts",
      "quantityKg": 10450,
      "packageCount": 220,
      "packageType": "Cartons"
    },
    "documents": {
      "invoiceNumber": "INV-24003",
      "invoicePdfPath": "/sample-data/invoices/inv-24003.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20253639.pdf"
    }
  },
  {
    "lcuNo": "LCU23425478",
    "lrNo": "LR20254338",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Chennai", "state": "TN" },
    "destination": { "city": "Hyderabad", "state": "TS" },
    "pickupDate": "2025-10-05",
    "deliveryDate": "2025-10-06",
    "charges": {
      "baseFreight": 75630.07,
      "addOn": { "toll": 3592.01, "unloading": 3000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 4933.32, "cgstAmount": 4933.32 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 75630.07,
      "totalAdditionalCharges": 6592.01,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 4933.32,
      "cgstAmount": 4933.32,
      "totalPayableAmount": 92088.72
    },
    "material": {
      "description": "Electrical appliances",
      "quantityKg": 5600,
      "packageCount": 140,
      "packageType": "Cartons"
    },
    "documents": {
      "invoiceNumber": "INV-24004",
      "invoicePdfPath": "/sample-data/invoices/inv-24004.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20254338.pdf"
    }
  },
  {
    "lcuNo": "LCU33441066",
    "lrNo": "LR20252184",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Nagpur", "state": "MH" },
    "destination": { "city": "Raipur", "state": "CG" },
    "pickupDate": "2025-10-04",
    "deliveryDate": "2025-10-05",
    "charges": {
      "baseFreight": 53933.31,
      "addOn": { "toll": 2748.06, "unloading": 3000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 3580.88, "cgstAmount": 3580.88 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 53933.31,
      "totalAdditionalCharges": 5748.06,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 3580.88,
      "cgstAmount": 3580.88,
      "totalPayableAmount": 66843.13
    },
    "material": {
      "description": "Steel coils",
      "quantityKg": 22000,
      "packageCount": 12,
      "packageType": "Coils"
    },
    "documents": {
      "invoiceNumber": "INV-24005",
      "invoicePdfPath": "/sample-data/invoices/inv-24005.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20252184.pdf"
    }
  },
  {
    "lcuNo": "LCU56718800",
    "lrNo": "LR20254164",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Jaipur", "state": "RJ" },
    "destination": { "city": "Indore", "state": "MP" },
    "pickupDate": "2025-10-07",
    "deliveryDate": "2025-10-08",
    "charges": {
      "baseFreight": 35816.15,
      "addOn": { "toll": 3471.56, "unloading": 3000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 2537.26, "cgstAmount": 2537.26 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 35816.15,
      "totalAdditionalCharges": 6471.56,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 2537.26,
      "cgstAmount": 2537.26,
      "totalPayableAmount": 47362.23
    },
    "material": {
      "description": "Pharma products",
      "quantityKg": 3800,
      "packageCount": 190,
      "packageType": "Cartons"
    },
    "documents": {
      "invoiceNumber": "INV-24006",
      "invoicePdfPath": "/sample-data/invoices/inv-24006.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20254164.pdf"
    }
  },
  {
    "lcuNo": "LCU10215674",
    "lrNo": "LR20256388",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Bangalore", "state": "KA" },
    "destination": { "city": "Chennai", "state": "TN" },
    "pickupDate": "2025-10-08",
    "deliveryDate": "2025-10-09",
    "charges": {
      "baseFreight": 52882.57,
      "addOn": { "toll": 3119.89, "unloading": 3000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 3540.15, "cgstAmount": 3540.15 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 52882.57,
      "totalAdditionalCharges": 6119.89,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 3540.15,
      "cgstAmount": 3540.15,
      "totalPayableAmount": 66082.76
    },
    "material": {
      "description": "Consumer electronics",
      "quantityKg": 6400,
      "packageCount": 160,
      "packageType": "Cartons"
    },
    "documents": {
      "invoiceNumber": "INV-24007",
      "invoicePdfPath": "/sample-data/invoices/inv-24007.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20256388.pdf"
    }
  },
  {
    "lcuNo": "LCU10639747",
    "lrNo": "LR20257359",
    "transporter": "Global Logistics Inc",
    "status": "APPROVED",
    "origin": { "city": "Kolkata", "state": "WB" },
    "destination": { "city": "Patna", "state": "BR" },
    "pickupDate": "2025-10-02",
    "deliveryDate": "2025-10-03",
    "charges": {
      "baseFreight": 88540.68,
      "addOn": { "toll": 3336.58, "unloading": 3000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 5692.64, "cgstAmount": 5692.64 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 88540.68,
      "totalAdditionalCharges": 6336.58,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 5692.64,
      "cgstAmount": 5692.64,
      "totalPayableAmount": 106262.54
    },
    "material": {
      "description": "Industrial machinery",
      "quantityKg": 18000,
      "packageCount": 16,
      "packageType": "Crates"
    },
    "documents": {
      "invoiceNumber": "INV-24008",
      "invoicePdfPath": "/sample-data/invoices/inv-24008.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20257359.pdf"
    }
  },
  {
    "lcuNo": "LCU98765432",
    "lrNo": "LR20251290",
    "transporter": "RoadRunner Express",
    "status": "PENDING",
    "origin": { "city": "Mumbai", "state": "MH" },
    "destination": { "city": "Nashik", "state": "MH" },
    "pickupDate": "2025-10-10",
    "deliveryDate": "2025-10-11",
    "charges": {
      "baseFreight": 61220,
      "addOn": { "toll": 2560.4, "unloading": 1000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 3886.82, "cgstAmount": 3886.82 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 61220,
      "totalAdditionalCharges": 3560.4,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 3886.82,
      "cgstAmount": 3886.82,
      "totalPayableAmount": 72554.04
    },
    "material": {
      "description": "Beverage crates",
      "quantityKg": 5400,
      "packageCount": 270,
      "packageType": "Crates"
    },
    "documents": {
      "invoiceNumber": "INV-24009",
      "invoicePdfPath": "/sample-data/invoices/inv-24009.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20251290.pdf"
    }
  },
  {
    "lcuNo": "LCU55667788",
    "lrNo": "LR20253442",
    "transporter": "Northern Freightways",
    "status": "APPROVED",
    "origin": { "city": "Delhi", "state": "DL" },
    "destination": { "city": "Ludhiana", "state": "PB" },
    "pickupDate": "2025-10-01",
    "deliveryDate": "2025-10-02",
    "charges": {
      "baseFreight": 92400,
      "addOn": { "toll": 2920, "unloading": 2000, "other": 0 },
      "penalties": { "penaltyAmount": 0, "discountAmount": 0 },
      "taxes": { "sgstRate": 0.06, "cgstRate": 0.06, "sgstAmount": 5839.2, "cgstAmount": 5839.2 }
    },
    "invoiceSummary": {
      "totalFreightCharges": 92400,
      "totalAdditionalCharges": 4920,
      "totalPenaltyAmount": 0,
      "discountApplied": 0,
      "sgstAmount": 5839.2,
      "cgstAmount": 5839.2,
      "totalPayableAmount": 108998.4
    },
    "material": {
      "description": "Textile rolls",
      "quantityKg": 15000,
      "packageCount": 50,
      "packageType": "Rolls"
    },
    "documents": {
      "invoiceNumber": "INV-24010",
      "invoicePdfPath": "/sample-data/invoices/inv-24010.pdf",
      "epodPdfPath": "/sample-data/epod/epod-lr20253442.pdf"
    }
  }
];

async function addJsonJourneys() {
  console.log('🚀 Starting to add JSON journeys to database...\n');

  // Get first user and transporter IDs
  const { data: users } = await supabase.from('users').select('id, full_name').limit(10);
  if (!users || users.length === 0) {
    console.error('❌ No users found. Please seed users first.');
    return;
  }

  const consignorId = users[0].id;
  const transporterMap = {};

  // Create or get transporters
  for (const journey of jsonJourneys) {
    if (!transporterMap[journey.transporter]) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('full_name', journey.transporter)
        .eq('role', 'transporter')
        .single();

      if (existing) {
        transporterMap[journey.transporter] = existing.id;
      } else {
        const { data: newTransporter } = await supabase
          .from('users')
          .insert({
            full_name: journey.transporter,
            email: `${journey.transporter.toLowerCase().replace(/\s+/g, '')}@example.com`,
            role: 'transporter',
          })
          .select()
          .single();
        transporterMap[journey.transporter] = newTransporter.id;
      }
    }
  }

  console.log(`✅ Found/created ${Object.keys(transporterMap).length} transporters\n`);

  // Delete existing journeys with epod_status = 'approved' or 'pending'
  // First delete related records to avoid foreign key constraints
  console.log('🗑️  Removing existing journeys from ePOD Approved/Pending tabs...');
  
  // Get journey IDs to delete
  const { data: journeysToDelete } = await supabase
    .from('journeys')
    .select('id')
    .in('epod_status', ['approved', 'pending']);

  if (journeysToDelete && journeysToDelete.length > 0) {
    const journeyIds = journeysToDelete.map(j => j.id);
    
    // Delete related records first
    await supabase.from('invoice_documents').delete().in('journey_id', journeyIds);
    await supabase.from('pod_documents').delete().in('journey_id', journeyIds);
    await supabase.from('bulk_job_items').delete().in('journey_id', journeyIds);
    
    // Delete proformas
    await supabase.from('proformas').delete().in('journey_id', journeyIds);
    
    // Finally delete journeys
    const { error: deleteError } = await supabase
      .from('journeys')
      .delete()
      .in('id', journeyIds);

    if (deleteError) {
      console.error('⚠️  Error deleting old journeys:', deleteError.message);
    } else {
      console.log(`✅ Removed ${journeyIds.length} old journeys\n`);
    }
  } else {
    console.log('✅ No old journeys to remove\n');
  }

  const createdJourneys = [];

  // Insert journeys
  for (const jsonJourney of jsonJourneys) {
    const transporterId = transporterMap[jsonJourney.transporter];
    const epodStatus = jsonJourney.status === 'APPROVED' ? 'approved' : 'pending';
    const journeyNumber = `JY${jsonJourney.lrNo.replace('LR', '')}`;

    const { data: journey, error: journeyError } = await supabase
      .from('journeys')
      .insert({
        journey_number: jsonJourney.lrNo, // Use LR number as journey_number
        load_id: jsonJourney.lcuNo,
        vehicle_number: `MH${Math.floor(Math.random() * 100)}AB${Math.floor(Math.random() * 10000)}`,
        consignor_id: consignorId,
        transporter_id: transporterId,
        origin: `${jsonJourney.origin.city}, ${jsonJourney.origin.state}`,
        destination: `${jsonJourney.destination.city}, ${jsonJourney.destination.state}`,
        journey_date: jsonJourney.pickupDate,
        closure_date: jsonJourney.deliveryDate,
        epod_status: epodStatus,
        status: 'closed',
      })
      .select()
      .single();

    if (journeyError) {
      console.error(`❌ Error creating journey ${jsonJourney.lrNo}:`, journeyError.message);
      continue;
    }

    console.log(`✅ Created journey: ${jsonJourney.lrNo} (${epodStatus})`);

    // Create proforma with materials data
    // Note: category must be 'open' for journeys to show in Closed tab
    const { error: proformaError } = await supabase
      .from('proformas')
      .insert({
        journey_id: journey.id,
        proforma_number: `PF-${jsonJourney.lcuNo}`,
        base_freight: jsonJourney.charges.baseFreight,
        detention_charge: 0,
        toll_charge: jsonJourney.charges.addOn.toll,
        unloading_charge: jsonJourney.charges.addOn.unloading,
        other_charges: jsonJourney.charges.addOn.other,
        total_amount: jsonJourney.invoiceSummary.totalPayableAmount,
        category: 'open', // Must be 'open' for Closed tab filtering
      });

    if (proformaError) {
      console.error(`⚠️  Error creating proforma for ${jsonJourney.lrNo}:`, proformaError.message);
    }

    createdJourneys.push({ journey, jsonJourney });
  }

  console.log(`\n✅ Successfully added ${createdJourneys.length} journeys!`);
  console.log(`   Approved: ${createdJourneys.filter(j => j.jsonJourney.status === 'APPROVED').length}`);
  console.log(`   Pending: ${createdJourneys.filter(j => j.jsonJourney.status === 'PENDING').length}`);
}

addJsonJourneys().catch(console.error);

