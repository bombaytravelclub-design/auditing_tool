#!/usr/bin/env node
/**
 * Update or Create Journeys for ePOD Pending Status
 * Based on provided JSON data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JSON data provided by user
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

async function getOrCreateTransporter(transporterName) {
  // Try to find existing transporter
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('full_name', transporterName)
    .eq('role', 'transporter')
    .limit(1)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new transporter
  const { data: newTransporter, error } = await supabase
    .from('users')
    .insert({
      full_name: transporterName,
      email: `${transporterName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      role: 'transporter',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Error creating transporter ${transporterName}:`, error);
    // Try to get any transporter as fallback
    const { data: anyTransporter } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'transporter')
      .limit(1)
      .single();
    return anyTransporter?.id || null;
  }

  return newTransporter.id;
}

async function processJourney(journeyData) {
  try {
    console.log(`\n📦 Processing: ${journeyData.lrNo} (${journeyData.lcuNo})`);

    // Get or create transporter
    const transporterId = await getOrCreateTransporter(journeyData.transporter);
    if (!transporterId) {
      console.error(`  ❌ Could not get/create transporter`);
      return;
    }

    // Check if journey exists by journey_number (LR No)
    const { data: existingJourney } = await supabase
      .from('journeys')
      .select('id')
      .eq('journey_number', journeyData.lrNo)
      .limit(1)
      .single();

    let journeyId;

    if (existingJourney) {
      // Update existing journey
      journeyId = existingJourney.id;
      const { error: updateError } = await supabase
        .from('journeys')
        .update({
          load_id: journeyData.lcuNo,
          vehicle_number: `MH${Math.floor(Math.random() * 100)}AB${Math.floor(Math.random() * 10000)}`,
          origin: journeyData.origin,
          destination: journeyData.destination,
          journey_date: journeyData.pickupDate,
          closure_date: journeyData.deliveryDate,
          epod_status: 'pending',
          status: 'ongoing',
          transporter_id: transporterId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', journeyId);

      if (updateError) {
        console.error(`  ❌ Error updating journey:`, updateError);
        return;
      }
      console.log(`  ✅ Updated existing journey`);
    } else {
      // Create new journey
      const { data: newJourney, error: createError } = await supabase
        .from('journeys')
        .insert({
          journey_number: journeyData.lrNo,
          load_id: journeyData.lcuNo,
          vehicle_number: `MH${Math.floor(Math.random() * 100)}AB${Math.floor(Math.random() * 10000)}`,
          origin: journeyData.origin,
          destination: journeyData.destination,
          journey_date: journeyData.pickupDate,
          closure_date: journeyData.deliveryDate,
          epod_status: 'pending',
          status: 'ongoing',
          transporter_id: transporterId,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`  ❌ Error creating journey:`, createError);
        return;
      }

      journeyId = newJourney.id;
      console.log(`  ✅ Created new journey`);
    }

    // Update or create proforma
    const { data: existingProforma } = await supabase
      .from('proformas')
      .select('id')
      .eq('journey_id', journeyId)
      .limit(1)
      .single();

    // Calculate charges breakdown
    // Assuming addOnCharges includes toll, unloading, etc.
    // Split addOnCharges roughly: 30% toll, 40% unloading, 30% other
    const tollCharge = Math.round((journeyData.addOnCharges * 0.3) * 100) / 100;
    const unloadingCharge = Math.round((journeyData.addOnCharges * 0.4) * 100) / 100;
    const otherCharges = Math.round((journeyData.addOnCharges * 0.3) * 100) / 100;
    const gstAmount = Math.round((journeyData.totalAmount - journeyData.baseCharges - journeyData.addOnCharges) * 100) / 100;

    if (existingProforma) {
      // Update existing proforma
      const { error: proformaError } = await supabase
        .from('proformas')
        .update({
          base_freight: journeyData.baseCharges,
          toll_charge: tollCharge,
          unloading_charge: unloadingCharge,
          other_charges: otherCharges,
          gst_amount: gstAmount,
          total_amount: journeyData.totalAmount,
          category: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProforma.id);

      if (proformaError) {
        console.error(`  ❌ Error updating proforma:`, proformaError);
      } else {
        console.log(`  ✅ Updated proforma`);
      }
    } else {
      // Create new proforma
      const { error: proformaError } = await supabase
        .from('proformas')
        .insert({
          journey_id: journeyId,
          proforma_number: `PRO-${journeyData.journeyId}`,
          base_freight: journeyData.baseCharges,
          toll_charge: tollCharge,
          unloading_charge: unloadingCharge,
          other_charges: otherCharges,
          gst_amount: gstAmount,
          total_amount: journeyData.totalAmount,
          category: 'open',
          transporter_id: transporterId,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (proformaError) {
        console.error(`  ❌ Error creating proforma:`, proformaError);
      } else {
        console.log(`  ✅ Created proforma`);
      }
    }

    // Store material info in journey metadata (as JSONB if column exists, or we'll use it in transformation)
    // Material data: description, quantityKg, packages
    const materialInfo = {
      description: journeyData.material.description,
      quantityKg: journeyData.material.quantityKg,
      packages: journeyData.material.packages,
    };
    
    // Try to update journey with material info (if material_details JSONB column exists)
    // If column doesn't exist, we'll use this data in the transformation function
    await supabase
      .from('journeys')
      .update({
        // Store material info - if material_details column exists
        // If not, we'll use this in the API transformation
      })
      .eq('id', journeyId);
    
    // Store material info in materials table
    if (journeyData.material) {
      // Extract UOM from packages (e.g., "18 Drums" -> "Drums")
      const packagesMatch = journeyData.material.packages?.match(/(\d+)\s*(.+)/);
      const uom = packagesMatch ? packagesMatch[2].trim() : 'Units';
      
      // Map: description → item (material name), packages → quantity
      const item = journeyData.material.description; // Material name
      const quantity = journeyData.material.packages; // Quantity (e.g., "18 Drums")
      
      // Check if material already exists for this journey
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
          console.error(`  ⚠️  Error updating material:`, materialError);
        } else {
          console.log(`  📋 Updated material: ${journeyData.material.description} (${journeyData.material.quantityKg} kg, ${journeyData.material.packages})`);
        }
      } else {
        const { error: materialError } = await supabase
          .from('materials')
          .insert(materialData);
        
        if (materialError) {
          console.error(`  ⚠️  Error inserting material:`, materialError);
        } else {
          console.log(`  📋 Created material: ${journeyData.material.description} (${journeyData.material.quantityKg} kg, ${journeyData.material.packages})`);
        }
      }
    }

    return { success: true, journeyId };
  } catch (error) {
    console.error(`  ❌ Error processing journey:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Starting ePOD Pending Journeys Update');
  console.log(`📊 Processing ${journeysData.length} journeys\n`);

  const results = [];
  for (const journeyData of journeysData) {
    const result = await processJourney(journeyData);
    results.push(result);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  const successful = results.filter(r => r?.success).length;
  const failed = results.filter(r => !r?.success).length;
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n✅ All journeys processed successfully!');
  } else {
    console.log('\n⚠️ Some journeys failed. Check errors above.');
  }
}

main().catch(console.error);

