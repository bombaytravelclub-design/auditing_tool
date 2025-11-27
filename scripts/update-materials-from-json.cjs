/**
 * Script to update journeys and materials from JSON data
 * This script will:
 * 1. Create/update journeys based on the JSON
 * 2. Create/update materials for each journey
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const journeysData = [
  {
    "journeyId": "JRN-24001",
    "lcuNo": "LCU95304199",
    "lrNo": "LR20257713",
    "transporter": "Global Logistics Inc",
    "origin": "Bangalore, KA",
    "destination": "Surat, GJ",
    "pickupDate": "2025-01-09",
    "deliveryDate": "2025-01-12",
    "baseCharges": 47727.03,
    "addOnCharges": 1568.93,
    "totalAmount": 58169.23,
    "podStatus": "Pending",
    "material": {
      "description": "Industrial chemicals (non-hazardous)",
      "quantityKg": 1764,
      "packages": "18 Drums"
    }
  },
  {
    "journeyId": "JRN-24002",
    "lcuNo": "LCU44201397",
    "lrNo": "LR20251231",
    "transporter": "Global Logistics Inc",
    "origin": "Bangalore, KA",
    "destination": "Ahmedabad, GJ",
    "pickupDate": "2025-01-10",
    "deliveryDate": "2025-01-13",
    "baseCharges": 85195.65,
    "addOnCharges": 8392.15,
    "totalAmount": 103138.34,
    "podStatus": "Pending",
    "material": {
      "description": "Food-grade chemicals",
      "quantityKg": 2200,
      "packages": "22 Drums"
    }
  },
  {
    "journeyId": "JRN-24003",
    "lcuNo": "LCU85015386",
    "lrNo": "LR20253639",
    "transporter": "Global Logistics Inc",
    "origin": "Hyderabad, TS",
    "destination": "Mumbai, MH",
    "pickupDate": "2025-01-11",
    "deliveryDate": "2025-01-15",
    "baseCharges": 122728.91,
    "addOnCharges": 18178.13,
    "totalAmount": 157815.88,
    "podStatus": "Pending",
    "material": {
      "description": "Solvent chemicals",
      "quantityKg": 2000,
      "packages": "20 Drums"
    }
  },
  {
    "journeyId": "JRN-24004",
    "lcuNo": "LCU23425478",
    "lrNo": "LR20254338",
    "transporter": "Global Logistics Inc",
    "origin": "Chennai, TN",
    "destination": "Bangalore, KA",
    "pickupDate": "2025-01-12",
    "deliveryDate": "2025-01-14",
    "baseCharges": 75630.07,
    "addOnCharges": 8392.01,
    "totalAmount": 94104.72,
    "podStatus": "Pending",
    "material": {
      "description": "Industrial resins",
      "quantityKg": 1500,
      "packages": "15 Drums"
    }
  },
  {
    "journeyId": "JRN-24005",
    "lcuNo": "LCU33441066",
    "lrNo": "LR20252184",
    "transporter": "Global Logistics Inc",
    "origin": "Bangalore, KA",
    "destination": "Hyderabad, TS",
    "pickupDate": "2025-01-13",
    "deliveryDate": "2025-01-16",
    "baseCharges": 53933.31,
    "addOnCharges": 6948.06,
    "totalAmount": 68187.13,
    "podStatus": "Pending",
    "material": {
      "description": "Specialty additives",
      "quantityKg": 1800,
      "packages": "18 Drums"
    }
  }
];

async function getOrCreateConsignor() {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'consignor')
    .limit(1)
    .single();
  
  if (existing) return existing.id;
  
  const { data: newConsignor } = await supabase
    .from('users')
    .insert({
      email: 'consignor@example.com',
      role: 'consignor',
      full_name: 'Default Consignor',
      company_id: 'CONSIGNOR-001',
    })
    .select('id')
    .single();
  
  return newConsignor?.id;
}

async function getOrCreateTransporter(transporterName) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'transporter')
    .eq('full_name', transporterName)
    .limit(1)
    .single();
  
  if (existing) return existing.id;
  
  const { data: newTransporter } = await supabase
    .from('users')
    .insert({
      email: `${transporterName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      role: 'transporter',
      full_name: transporterName,
      company_id: `TRANS-${Date.now()}`,
    })
    .select('id')
    .single();
  
  return newTransporter?.id;
}

async function processJourney(journeyData) {
  try {
    console.log(`\n📦 Processing: ${journeyData.lrNo} (${journeyData.lcuNo})`);

    const consignorId = await getOrCreateConsignor();
    const transporterId = await getOrCreateTransporter(journeyData.transporter);

    // Find or create journey
    const { data: existingJourney } = await supabase
      .from('journeys')
      .select('id')
      .eq('journey_number', journeyData.lrNo)
      .limit(1)
      .single();

    let journeyId;
    if (existingJourney) {
      journeyId = existingJourney.id;
      // Update journey
      await supabase
        .from('journeys')
        .update({
          vehicle_number: `MH11AB${Math.floor(1000 + Math.random() * 9000)}`,
          load_id: journeyData.lcuNo,
          origin: journeyData.origin,
          destination: journeyData.destination,
          consignor_id: consignorId,
          transporter_id: transporterId,
          journey_date: journeyData.pickupDate,
          closure_date: journeyData.deliveryDate,
          status: 'closed',
          epod_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', journeyId);
      console.log(`  ✅ Updated journey`);
    } else {
      // Create journey
      const { data: newJourney } = await supabase
        .from('journeys')
        .insert({
          journey_number: journeyData.lrNo,
          vehicle_number: `MH11AB${Math.floor(1000 + Math.random() * 9000)}`,
          load_id: journeyData.lcuNo,
          origin: journeyData.origin,
          destination: journeyData.destination,
          consignor_id: consignorId,
          transporter_id: transporterId,
          journey_date: journeyData.pickupDate,
          closure_date: journeyData.deliveryDate,
          status: 'closed',
          epod_status: 'pending',
        })
        .select('id')
        .single();
      journeyId = newJourney.id;
      console.log(`  ✅ Created journey`);
    }

    // Process material
    if (journeyData.material) {
      // Extract UOM from packages (e.g., "18 Drums" -> "Drums")
      const packagesMatch = journeyData.material.packages?.match(/(\d+)\s*(.+)/);
      const uom = packagesMatch ? packagesMatch[2].trim() : 'Units';
      
      // Map: description → item (material name), packages → quantity
      const item = journeyData.material.description; // Material name
      const quantity = journeyData.material.packages; // Quantity (e.g., "18 Drums")

      // Check if material exists
      const { data: existingMaterial } = await supabase
        .from('materials')
        .select('id')
        .eq('journey_id', journeyId)
        .limit(1)
        .maybeSingle();

      const materialData = {
        journey_id: journeyId,
        description: journeyData.material.description, // Keep description for reference
        quantity_kg: journeyData.material.quantityKg,
        packages: journeyData.material.packages, // This will be displayed as quantity
        item: item, // Material name from description
        uom: uom,
        weight: journeyData.material.quantityKg,
      };

      if (existingMaterial) {
        const { error: materialError } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', existingMaterial.id);
        
        if (materialError) {
          console.error(`  ❌ Error updating material:`, materialError.message);
        } else {
          console.log(`  📋 Updated material: ${journeyData.material.description}`);
        }
      } else {
        const { error: materialError, data: insertedMaterial } = await supabase
          .from('materials')
          .insert(materialData)
          .select();
        
        if (materialError) {
          console.error(`  ❌ Error inserting material:`, materialError.message);
          console.error(`     Details:`, materialError.details);
        } else {
          console.log(`  📋 Created material: ${journeyData.material.description}`);
        }
      }
    }

    // Update or create proforma
    const { data: existingProforma } = await supabase
      .from('proformas')
      .select('id')
      .eq('journey_id', journeyId)
      .limit(1)
      .single();

    const tollCharge = Math.round((journeyData.addOnCharges * 0.3) * 100) / 100;
    const unloadingCharge = Math.round((journeyData.addOnCharges * 0.4) * 100) / 100;
    const otherCharges = Math.round((journeyData.addOnCharges * 0.3) * 100) / 100;
    const gstAmount = Math.round((journeyData.totalAmount - journeyData.baseCharges - journeyData.addOnCharges) * 100) / 100;

    const proformaData = {
      journey_id: journeyId,
      proforma_number: `PRO-${journeyData.lrNo}`,
      base_freight: journeyData.baseCharges,
      toll_charge: tollCharge,
      unloading_charge: unloadingCharge,
      other_charges: otherCharges,
      gst_amount: gstAmount,
      total_amount: journeyData.totalAmount,
      category: 'open',
      consignor_id: consignorId,
      transporter_id: transporterId,
      updated_at: new Date().toISOString(),
    };

    if (existingProforma) {
      await supabase
        .from('proformas')
        .update(proformaData)
        .eq('id', existingProforma.id);
      console.log(`  💰 Updated proforma`);
    } else {
      await supabase
        .from('proformas')
        .insert(proformaData);
      console.log(`  💰 Created proforma`);
    }

    return { success: true, journeyId };
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Starting journey and material update...\n');
  
  const results = [];
  for (const journeyData of journeysData) {
    const result = await processJourney(journeyData);
    results.push(result);
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Successful: ${results.filter(r => r.success).length}`);
  console.log(`  ❌ Failed: ${results.filter(r => !r.success).length}`);
  
  console.log('\n✅ Done!');
}

main().catch(console.error);

