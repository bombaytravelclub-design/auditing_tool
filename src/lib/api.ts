/**
 * API Client for Freight Audit Backend
 * Fetches real data from Express API
 */

// Auto-detect API URL based on environment (runtime, not build-time)
function getApiBaseUrl() {
  // Always check at runtime, not at module load time
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    // If not localhost, we're on Vercel/production - use same origin
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
      return origin;
    }
    
    // Localhost - use local backend
    return 'http://localhost:3000';
  }
  
  // Server-side or build time - use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000';
}

// Get API URL at runtime, not module load time
const API_BASE_URL = getApiBaseUrl();

// ============================================================================
// Types matching backend response
// ============================================================================

export interface ApiProforma {
  id: string;
  proforma_number: string;
  journey_id: string;
  base_freight: number;
  detention_charge: number;
  toll_charge: number;
  unloading_charge: number;
  other_charges: number;
  gst_amount: number;
  total_amount: number;
  category: string;
  invoice_matched: boolean;
  generated_at: string;
  journey?: ApiJourney;
  invoice_document?: ApiInvoiceDocument[];
}

export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
}

export interface ApiJourney {
  id: string;
  journey_number: string;
  vehicle_number: string;
  load_id: string;
  origin: string;
  destination: string;
  status: string;
  epod_status: string;
  journey_date: string;
  closure_date?: string;
  transporter?: ApiUser;
  consignor?: ApiUser;
}

export interface ApiInvoiceDocument {
  id: string;
  invoice_number: string;
  invoice_date: string;
  file_name: string;
  ocr_confidence: number;
  match_status: string;
  variance_total: number;
  ocr_total_amount: number;
}

export interface ApiProformasResponse {
  data: ApiProforma[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// API Functions
// ============================================================================

export async function fetchProformas(params?: {
  category?: string;
  epodStatus?: string;
  page?: number;
  limit?: number;
}): Promise<ApiProformasResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.category) searchParams.append('category', params.category);
  if (params?.epodStatus) searchParams.append('epodStatus', params.epodStatus);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  // Get API URL at runtime to ensure correct detection
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}/api/proformas${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  console.log('🔍 fetchProformas - API URL:', url);
  console.log('🔍 fetchProformas - API_BASE_URL:', apiBase);
  console.log('🔍 fetchProformas - window.location:', typeof window !== 'undefined' ? window.location.href : 'N/A');
  
  try {
    const response = await fetch(url);
    console.log('📡 fetchProformas - Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ fetchProformas - Error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      throw new Error(errorData.error || errorData.details || `API error: ${response.statusText}`);
    }
    
    const jsonData = await response.json();
    console.log('✅ fetchProformas - Response data:', {
      hasData: !!jsonData.data,
      dataLength: jsonData.data?.length || 0,
      total: jsonData.total,
      keys: Object.keys(jsonData)
    });
    
    return jsonData;
  } catch (err: any) {
    console.error('❌ fetchProformas error:', err);
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new Error('Cannot connect to backend API. Make sure the backend server is running on http://localhost:3000');
    }
    throw err;
  }
}

export async function fetchProformaById(id: string): Promise<ApiProforma> {
  const response = await fetch(`${API_BASE_URL}/api/proformas/${id}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================================
// Data Transformation Functions
// ============================================================================

export function transformProformaToJourney(proforma: ApiProforma) {
  const journey = proforma.journey;
  if (!journey) return null;

  // Use journey_number as LR number (it's already the LR number from JSON)
  const lrNumber = journey.journey_number.startsWith('LR') ? journey.journey_number : journey.journey_number;
  
  return {
    id: journey.id, // CRITICAL: Use journey.id, not proforma.id (backend expects journey UUIDs)
    lcuNo: journey.load_id,
    journeyNo: journey.journey_number,
    lrNo: lrNumber,
    transporter: journey.transporter?.full_name || 'Unknown Transporter',
    origin: journey.origin,
    destination: journey.destination,
    baseCharges: proforma.base_freight,
    addonCharges: proforma.detention_charge + proforma.toll_charge + proforma.unloading_charge + proforma.other_charges,
    totalAmount: proforma.total_amount,
    status: getStatusLabel(journey.epod_status, proforma.category, journey.status),
    category: getCategoryLabel(journey.epod_status, proforma.category, journey.status),
    pickupDate: journey.journey_date,
    deliveryDate: journey.closure_date || undefined,
    vehicleNumber: journey.vehicle_number,
    vehicleType: "Container", // Could be enriched
    materialType: "General Cargo", // Could be enriched
    consigneeName: journey.consignor?.full_name || 'Unknown Consignee',
    paymentMode: "To-pay" as const,
    contractType: "Rate Card" as const,
    charges: [
      {
        id: `${proforma.id}-base`,
        type: "Base Freight",
        amount: proforma.base_freight,
        source: "System" as const,
        category: "Base" as const,
        gstApplicable: true,
        gstPercent: 18,
        totalWithGST: proforma.base_freight * 1.18,
      },
      ...(proforma.detention_charge > 0 ? [{
        id: `${proforma.id}-detention`,
        type: "Detention Charges",
        amount: proforma.detention_charge,
        source: "System" as const,
        category: "Add-on" as const,
        gstApplicable: true,
        gstPercent: 18,
        totalWithGST: proforma.detention_charge * 1.18,
      }] : []),
      ...(proforma.toll_charge > 0 ? [{
        id: `${proforma.id}-toll`,
        type: "Toll Charges",
        amount: proforma.toll_charge,
        source: "System" as const,
        category: "Add-on" as const,
        gstApplicable: false,
      }] : []),
      ...(proforma.unloading_charge > 0 ? [{
        id: `${proforma.id}-unloading`,
        type: "Unloading Charges",
        amount: proforma.unloading_charge,
        source: "System" as const,
        category: "Add-on" as const,
        gstApplicable: false,
      }] : []),
    ],
    podDocuments: journey.epod_status === 'approved' ? [{
      id: `pod-${journey.id}`,
      filename: `POD_${journey.journey_number}.pdf`,
      uploadDate: journey.closure_date || journey.journey_date,
      uploadedBy: "System",
      status: "Approved" as const,
    }] : [],
    invoiceDocuments: proforma.invoice_document?.map(inv => ({
      id: inv.id,
      filename: inv.file_name,
      uploadDate: inv.invoice_date,
      uploadedBy: "Transporter",
      status: inv.match_status === 'exact_match' ? "Approved" as const : "Pending" as const,
    })) || [],
    materials: generateMaterialsForJourney(journey.id, journey.material_type || 'General Cargo'),
  };
}

// Helper function to generate materials for a journey
function generateMaterialsForJourney(journeyId: string, materialType: string) {
  const materialTypes = [
    { item: 'Electronics', description: 'Consumer electronics and components', uom: 'Boxes' },
    { item: 'Textiles', description: 'Fabric rolls and garments', uom: 'Rolls' },
    { item: 'Machinery Parts', description: 'Industrial machinery components', uom: 'Units' },
    { item: 'Food Products', description: 'Packaged food items', uom: 'Cartons' },
    { item: 'Furniture', description: 'Office and home furniture', uom: 'Pieces' },
    { item: 'Automobile Parts', description: 'Vehicle spare parts', uom: 'Units' },
    { item: 'Chemicals', description: 'Industrial chemicals (non-hazardous)', uom: 'Drums' },
    { item: 'Building Materials', description: 'Construction materials', uom: 'Pallets' },
  ];
  
  // Use journey ID to determine consistent materials for same journey
  const hash = journeyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numItems = (hash % 2) + 1; // 1-2 items per journey
  const materials = [];
  
  for (let i = 0; i < numItems; i++) {
    const materialIndex = (hash + i) % materialTypes.length;
    const material = materialTypes[materialIndex];
    const quantity = 10 + ((hash + i * 10) % 150); // 10-160 quantity
    const weight = quantity * (20 + ((hash + i * 5) % 80)); // Weight varies
    
    materials.push({
      id: `mat-${journeyId}-${i}`,
      item: material.item,
      description: material.description,
      quantity: quantity,
      uom: material.uom,
      weight: weight,
    });
  }
  
  return materials;
}

function getStatusLabel(epodStatus: string, category: string, journeyStatus: string): string {
  // Ongoing trips
  if (journeyStatus === 'ongoing') return 'Ongoing';
  
  // Disputed journeys - map ePOD status to display status
  if (category === 'disputed' || journeyStatus === 'disputed') {
    if (epodStatus === 'rejected') return 'Missing details'; // Rejected tab
    if (epodStatus === 'pending') return 'In Audit'; // Review Pending tab
    if (epodStatus === 'approved') return 'Yet to raise'; // Re-Upload Supporting Doc tab
    return 'In Audit';
  }
  
  // Closed journeys
  if (epodStatus === 'approved') return 'Approved';
  if (epodStatus === 'pending') return 'Pending';
  if (epodStatus === 'rejected') return 'Missing details';
  
  return 'Yet to raise';
}

function getCategoryLabel(epodStatus: string, category: string, journeyStatus: string): string {
  // Ongoing trips
  if (journeyStatus === 'ongoing') return 'Open Trips';
  
  // Disputed category
  if (category === 'disputed' || journeyStatus === 'disputed') return 'Disputed';
  
  // Closed category (open proformas for closed journeys)
  if (category === 'open' && journeyStatus === 'closed') {
    if (epodStatus === 'approved') return 'ePOD Approved';
    if (epodStatus === 'pending') return 'ePOD Pending';
  }
  
  return 'Open Trips';
}

// ============================================================================
// Summary Statistics
// ============================================================================

export function calculateSummaryStats(proformas: ApiProforma[]) {
  const closedTrips = proformas.filter(p => p.category === 'open' && p.journey?.epod_status === 'approved').length;
  const disputedTrips = proformas.filter(p => p.category === 'disputed').length;
  const ongoingTrips = proformas.filter(p => p.journey?.status === 'ongoing').length;
  
  const closedAmount = proformas
    .filter(p => p.category === 'open' && p.journey?.epod_status === 'approved')
    .reduce((sum, p) => sum + p.total_amount, 0);
    
  const disputedAmount = proformas
    .filter(p => p.category === 'disputed')
    .reduce((sum, p) => sum + p.total_amount, 0);
    
  const ongoingAmount = proformas
    .filter(p => p.journey?.status === 'ongoing')
    .reduce((sum, p) => sum + p.total_amount, 0);

  return {
    closed: {
      count: closedTrips,
      amount: closedAmount,
    },
    disputed: {
      count: disputedTrips,
      amount: disputedAmount,
    },
    ongoing: {
      count: ongoingTrips,
      amount: ongoingAmount,
    },
  };
}

