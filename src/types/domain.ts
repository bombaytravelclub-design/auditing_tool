// Domain types for Freight Audit System
// Matches Supabase schema and API contracts

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'consignor' | 'transporter' | 'admin';

export type EpodStatus = 'pending' | 'approved' | 'rejected';

export type ProformaCategory = 'freight' | 'detention' | 'other';

export type BulkJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type BulkJobType = 'pod_upload' | 'invoice_upload';

export type JobItemStatus = 'pending' | 'matched' | 'partially_matched' | 'failed' | 'accepted' | 'rejected';

export type ReviewAction = 'accept' | 'reject' | 'comment';

// ============================================================================
// OCR RESULT TYPES
// ============================================================================

export interface PodOcrResult {
  journeyNumber?: string;
  vehicleNumber?: string;
  loadId?: string;
  charges?: {
    baseFreight?: number;
    tollCharges?: number;
    unloadingCharges?: number;
    fuelSurcharge?: number;
    otherCharges?: number;
    totalAmount?: number;
  };
  confidence: number;
  rawResponse?: any;
}

export interface InvoiceOcrResult {
  invoiceNumber?: string;
  journeyNumber?: string;
  vehicleNumber?: string;
  loadId?: string;
  charges: {
    baseFreight?: number;
    tollCharges?: number;
    unloadingCharges?: number;
    fuelSurcharge?: number;
    otherCharges?: number;
    totalAmount?: number;
  };
  confidence: number;
  rawResponse?: any;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Journey {
  id: string;
  journey_no: string;
  vehicle_no: string;
  load_id: string;
  consignor_id: string;
  transporter_id: string;
  origin: string;
  destination: string;
  material_name: string;
  quantity: number;
  weight: number;
  pickup_date: string;
  delivery_date: string | null;
  epod_status: EpodStatus;
  epod_approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Proforma {
  id: string;
  proforma_no: string;
  journey_id: string;
  consignor_id: string;
  transporter_id: string;
  category: ProformaCategory;
  base_freight_charge: number;
  additional_charges: number;
  penalty_adjustments: number;
  total_amount: number;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface PODDocument {
  id: string;
  journey_id: string;
  file_path: string;
  file_name: string;
  uploaded_by: string;
  extracted_metadata: ExtractedPODMetadata | null;
  ocr_confidence: number | null;
  uploaded_at: string;
  created_at: string;
}

export interface InvoiceDocument {
  id: string;
  proforma_id: string;
  file_path: string;
  file_name: string;
  uploaded_by: string;
  extracted_data: ExtractedInvoiceData | null;
  ocr_confidence: number | null;
  uploaded_at: string;
  created_at: string;
}

export interface BulkJob {
  id: string;
  job_type: BulkJobType;
  status: BulkJobStatus;
  created_by: string;
  total_items: number;
  processed_items: number;
  matched_items: number;
  failed_items: number;
  summary: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BulkJobItem {
  id: string;
  job_id: string;
  journey_id: string | null;
  proforma_id: string | null;
  document_id: string;
  status: JobItemStatus;
  extracted_data: any;
  match_result: any;
  variance_details: any | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewAction {
  id: string;
  job_item_id: string;
  action: ReviewAction;
  comment: string | null;
  performed_by: string;
  performed_at: string;
  created_at: string;
}

// ============================================================================
// OCR EXTRACTED DATA TYPES
// ============================================================================

export interface ExtractedPODMetadata {
  vehicle: string;
  loadId: string;
  journeyNo: string;
  deliveryDate?: string;
  recipientName?: string;
  recipientSignature?: boolean;
  confidence: number;
}

export interface ExtractedInvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  vehicleNo: string;
  journeyNo: string;
  loadId: string;
  baseFreightCharge: number;
  additionalCharges: number;
  totalAmount: number;
  confidence: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ProformaFilters {
  category?: ProformaCategory;
  epodStatus?: EpodStatus;
  page?: number;
  limit?: number;
}

export interface ProformaListResponse {
  data: Proforma[];
  total: number;
  page: number;
  limit: number;
}

export interface BulkUploadRequest {
  journeyIds?: string[];
  proformaIds?: string[];
  files: File[];
}

export interface BulkUploadResponse {
  jobId: string;
  totalFiles: number;
  summary: {
    matched: number;
    partiallyMatched: number;
    failed: number;
  };
}

export interface BulkJobSummaryResponse {
  job: BulkJob;
  items: BulkJobItem[];
}

export interface ReviewActionRequest {
  jobItemId: string;
  action: ReviewAction;
  comment?: string;
}

// ============================================================================
// AUDIT & MATCHING TYPES
// ============================================================================

export interface AuditTripResult {
  journeyId: string;
  matched: boolean;
  confidence: number;
  variances: {
    field: string;
    expected: any;
    actual: any;
    variance: number;
  }[];
}

export interface AuditSummary {
  totalTrips: number;
  matchedTrips: number;
  partiallyMatchedTrips: number;
  failedTrips: number;
  totalVariance: number;
  averageConfidence: number;
}

export interface FreightAuditResult {
  proformaId: string;
  invoiceDocumentId: string;
  matched: boolean;
  confidence: number;
  variances: {
    field: string;
    proformaValue: any;
    invoiceValue: any;
    variance: number;
  }[];
}

// ============================================================================
// OCR CONFIGURATION
// ============================================================================

export interface OCRConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

export const DEFAULT_OCR_CONFIG: OCRConfig = {
  model: 'gpt-4o',
  temperature: 0.1,
  maxTokens: 2000,
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const MOCK_CONSIGNOR_ID = '00000000-0000-0000-0000-000000000001';
export const MOCK_TRANSPORTER_ID = '00000000-0000-0000-0000-000000000002';

export const VARIANCE_THRESHOLDS = {
  exact: 0,
  acceptable: 5, // 5%
  warning: 10, // 10%
  critical: 20, // 20%
};
