// Frontend API Client for Bulk Upload
// Auto-detect API URL based on environment
const getApiBase = () => {
  // In production (Vercel), use the same domain
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  // Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback to localhost for development
  return 'http://localhost:3000';
};

const API_BASE = getApiBase();

export interface BulkUploadRequest {
  type: 'POD' | 'Invoice';
  journeyIds: string[];
  files: File[];
}

export interface BulkUploadResponse {
  success: boolean;
  jobId: string;
  summary: {
    totalFiles: number;
    matched: number;
    needsReview: number;
    skipped: number;
  };
  items: any[];
}

export interface BulkJobResponse {
  success: boolean;
  job: {
    id: string;
    type: string;
    status: string;
    totalFiles: number;
    matched: number;
    needsReview: number;
    skipped: number;
    createdAt: string;
  };
  items: any[];
}

export interface ReviewActionRequest {
  itemId: string;
  chargeActions: Record<string, { status: 'accepted' | 'rejected'; comment?: string }>;
  overallDecision?: 'accepted' | 'rejected';
  comments?: string;
}

/**
 * Upload files for bulk processing (POD or Invoice)
 */
export async function uploadBulkDocuments(request: BulkUploadRequest): Promise<BulkUploadResponse> {
  try {
    // Convert files to base64 for API transmission
    const filesData = await Promise.all(
      request.files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        };
      })
    );

    const response = await fetch(`${API_BASE}/api/bulk-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: request.type,
        journeyIds: request.journeyIds,
        files: filesData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    throw error;
  }
}

/**
 * Get bulk job details and items
 */
export async function getBulkJob(jobId: string): Promise<BulkJobResponse> {
  try {
    console.log(`🔍 Fetching bulk job: ${jobId} from ${API_BASE}/api/bulk-jobs/${jobId}`);
    
    const response = await fetch(`${API_BASE}/api/bulk-jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      throw new Error(errorData.error || `Failed to fetch job: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`📦 Raw response (first 500 chars):`, responseText.substring(0, 500));
    
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('Response text:', responseText);
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }

    console.log('✅ Parsed response:', {
      hasSuccess: 'success' in jsonData,
      hasJob: !!jsonData.job,
      hasItems: !!jsonData.items,
      itemsCount: jsonData.items?.length || 0,
      keys: Object.keys(jsonData)
    });

    // Ensure response has expected structure
    if (!jsonData.job && jsonData.success !== false) {
      // If no job but success is not false, create minimal job
      jsonData.job = { id: jobId, type: 'pod', status: 'pending' };
    }

    return jsonData as BulkJobResponse;
  } catch (error: any) {
    console.error('❌ Get bulk job error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Submit review actions for a bulk job item
 */
export async function submitReviewAction(jobId: string, request: ReviewActionRequest): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/api/bulk-jobs/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit review');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Submit review error:', error);
    throw error;
  }
}

