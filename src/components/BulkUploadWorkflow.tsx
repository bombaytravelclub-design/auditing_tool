import { useState } from 'react';
import { X, Upload, FileText, Loader2, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';

type ScreenType = 'listing' | 'file-upload' | 'processing' | 'summary' | 'confirmation';
type UploadType = 'pod' | 'invoice' | null;
type MatchStatus = 'matched' | 'partially-matched' | 'missing-details' | 'failed';

interface MatchedJourney {
  id: string;
  lcuNo: string;
  journey: string;
  transporter: string;
  matchStatus: MatchStatus;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: MatchedJourney | null;
  onSubmit: (action: 'accept' | 'reject', reason?: string) => void;
}

// File Upload Screen
export function BulkFileUploadScreen({ 
  uploadType, 
  onClose, 
  onUpload 
}: { 
  uploadType: 'pod' | 'invoice'; 
  onClose: () => void;
  onUpload: () => void;
}) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = () => {
    // Simulate file selection
    setUploadedFiles(['invoice_batch_001.pdf', 'invoice_batch_002.pdf']);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f6f8fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#d6d6d6] px-[84px] py-[20px] flex items-center justify-between">
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[20px]">
          Bulk Upload {uploadType === 'pod' ? 'POD' : 'Invoice'}
        </p>
        <button 
          onClick={onClose}
          className="p-[4px] hover:bg-[#f0f1f7] rounded-[4px] transition-colors"
        >
          <X className="w-[24px] h-[24px] text-[#434343]" />
        </button>
      </div>

      {/* Content */}
      <div className="px-[84px] py-[40px] max-w-[1328px]">
        <div className="bg-white rounded-[8px] border border-[#ced1d7] p-[32px]">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-[8px] p-[48px] transition-colors ${
              isDragging ? 'border-blue-500 bg-[#e6f7ff]' : 'border-[#ced1d7] bg-[#f8f8f9]'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-[20px]">
              <div className="bg-[#434f64] rounded-[8px] size-[64px] flex items-center justify-center">
                <Upload className="w-[32px] h-[32px] text-white" />
              </div>
              <div className="text-center">
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[18px] mb-[8px]">
                  Drag and drop files here
                </p>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mb-[20px]">
                  or click to browse
                </p>
                <button
                  onClick={handleFileSelect}
                  className="bg-white border border-[#5f697b] px-[24px] py-[12px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors"
                >
                  <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                    Select Files
                  </span>
                </button>
              </div>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[12px]">
                Allowed file types: PDF, JPEG, PNG, DOC, XLSX. Max size: 100 MB per file
              </p>
            </div>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-[32px]">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[16px] mb-[16px]">
                Uploaded Files ({uploadedFiles.length})
              </p>
              <div className="flex flex-col gap-[12px]">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="bg-[#f8f8f9] border border-[#ced1d7] rounded-[8px] p-[12px] flex items-center justify-between">
                    <div className="flex items-center gap-[12px]">
                      <FileText className="w-[20px] h-[20px] text-[#5f697b]" />
                      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                        {file}
                      </p>
                    </div>
                    <button className="p-[4px] hover:bg-white rounded-[4px] transition-colors">
                      <X className="w-[16px] h-[16px] text-[#838c9d]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-[12px] justify-end mt-[32px]">
            <button
              onClick={onClose}
              className="bg-white border border-[#5f697b] px-[24px] py-[12px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors"
            >
              <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                Cancel
              </span>
            </button>
            <button
              onClick={onUpload}
              disabled={uploadedFiles.length === 0}
              className="bg-[#434f64] px-[24px] py-[12px] rounded-[8px] hover:bg-[#5f697b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[14px]">
                Upload & Process
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Processing Screen
export function ProcessingScreen({ uploadType }: { uploadType: 'pod' | 'invoice' }) {
  const [progress] = useState(72);
  
  const steps = [
    { label: 'Uploading documents', completed: true },
    { label: 'Running OCR extraction', completed: true },
    { label: 'Matching with load data', completed: true },
    { label: 'Validating information', completed: false },
    { label: 'Finalizing results', completed: false },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#f6f8fa] flex items-center justify-center">
      <div className="bg-white rounded-[12px] border border-[#ced1d7] p-[48px] max-w-[600px] w-full mx-[20px]">
        <div className="flex flex-col items-center gap-[24px]">
          {/* Loader Icon */}
          <div className="relative">
            <Loader2 className="w-[48px] h-[48px] text-[#434f64] animate-spin" />
          </div>
          
          {/* Title and Description */}
          <div className="text-center">
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[20px] mb-[8px]">
              Processing Documents
            </p>
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px]">
              Extracting information using OCR and matching with selected loads
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full">
            <div className="w-full bg-[#f0f1f7] rounded-full h-[8px] overflow-hidden mb-[8px]">
              <div 
                className="bg-[#434f64] h-full rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] text-center">
              {progress}% complete
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-[16px] w-full">
            <div className="bg-[#f8f8f9] rounded-[8px] p-[20px] text-center border border-[#f0f1f7]">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[32px] mb-[4px]">
                5/10
              </p>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px]">
                Total Files
              </p>
            </div>
            <div className="bg-[#f6ffed] rounded-[8px] p-[20px] text-center border border-[#d9f7be]">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#52c41a] text-[32px] mb-[4px]">
                7
              </p>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#52c41a] text-[14px]">
                Matched
              </p>
            </div>
            <div className="bg-[#fff7e6] rounded-[8px] p-[20px] text-center border border-[#ffd591]">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#ff6c19] text-[32px] mb-[4px]">
                2
              </p>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#ff6c19] text-[14px]">
                Needs Review
              </p>
            </div>
          </div>

          {/* Processing Steps Checklist */}
          <div className="w-full flex flex-col gap-[12px]">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-[12px]">
                <div className={`size-[20px] rounded-full border-2 flex items-center justify-center ${
                  step.completed 
                    ? 'bg-[#52c41a] border-[#52c41a]' 
                    : 'bg-white border-[#d6d6d6]'
                }`}>
                  {step.completed && (
                    <Check className="w-[12px] h-[12px] text-white" strokeWidth={3} />
                  )}
                </div>
                <p className={`font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[14px] ${
                  step.completed ? 'text-[#434f64]' : 'text-[#838c9d]'
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Screen
export function BulkUploadSummaryScreen({ 
  uploadType, 
  onBack,
  onOpenReview 
}: { 
  uploadType: 'pod' | 'invoice';
  onBack: () => void;
  onOpenReview: (journey: MatchedJourney) => void;
}) {
  const matchedJourneys: MatchedJourney[] = [
    { id: '1', lcuNo: 'TN09 RE3476', journey: 'JY20230900', transporter: 'BLR logistics', matchStatus: 'matched' },
    { id: '2', lcuNo: 'TN09 RE1234', journey: 'JY20230901', transporter: 'ABC transporters', matchStatus: 'partially-matched' },
    { id: '3', lcuNo: 'TN09 RE9101', journey: 'JY20230903', transporter: 'BLR logistics', matchStatus: 'missing-details' },
    { id: '4', lcuNo: 'TN09 RE5678', journey: 'JY20230902', transporter: 'XYZ logistics', matchStatus: 'failed' },
    { id: '5', lcuNo: 'TN09 RE1121', journey: 'JY20230904', transporter: 'BLR logistics', matchStatus: 'matched' },
  ];

  const matched = matchedJourneys.filter(j => j.matchStatus === 'matched').length;
  const partiallyMatched = matchedJourneys.filter(j => j.matchStatus === 'partially-matched').length;
  const failed = matchedJourneys.filter(j => j.matchStatus === 'missing-details' || j.matchStatus === 'failed').length;

  const getMatchStatusBadge = (status: MatchStatus) => {
    const badges = {
      'matched': { color: 'bg-[#f6ffed] text-[#52c41a]', label: 'Matched' },
      'partially-matched': { color: 'bg-[#ffebdc] text-[#ff6c19]', label: 'Partially Matched' },
      'missing-details': { color: 'bg-[#ffeaea] text-[#ff3533]', label: 'Missing Details' },
      'failed': { color: 'bg-[#ffeaea] text-[#ff3533]', label: 'Failed to Process' }
    };
    return badges[status];
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f6f8fa] overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-[#d6d6d6] px-[84px] py-[20px] flex items-center justify-between">
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[20px]">
          Bulk Upload Summary - {uploadType === 'pod' ? 'POD' : 'Invoice'}
        </p>
        <button 
          onClick={onBack}
          className="p-[4px] hover:bg-[#f0f1f7] rounded-[4px] transition-colors"
        >
          <X className="w-[24px] h-[24px] text-[#434343]" />
        </button>
      </div>

      {/* Content */}
      <div className="px-[84px] py-[40px]">
        {/* Summary Cards */}
        <div className="flex gap-[20px] mb-[32px]">
          <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[20px] flex-1">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[8px]">
              Total Journeys
            </p>
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[24px]">
              {matchedJourneys.length}
            </p>
          </div>
          <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[20px] flex-1">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[8px]">
              Matched
            </p>
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#52c41a] text-[24px]">
              {matched}
            </p>
          </div>
          <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[20px] flex-1">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[8px]">
              Partially Matched
            </p>
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#ff6c19] text-[24px]">
              {partiallyMatched}
            </p>
          </div>
          <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[20px] flex-1">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[8px]">
              Failed / Missing
            </p>
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#ff3533] text-[24px]">
              {failed}
            </p>
          </div>
        </div>

        {/* Journeys Table */}
        <div className="bg-white rounded-[8px] border border-[#ced1d7]">
          {/* Table Header */}
          <div className="border-b border-[#f0f1f7] px-[20px] py-[16px]">
            <div className="flex gap-[20px] items-center">
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[120px]">
                LCU NO
              </p>
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[150px]">
                Journey
              </p>
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] flex-1">
                Transporter
              </p>
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[180px]">
                Status
              </p>
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[120px]">
                Action
              </p>
            </div>
          </div>

          {/* Table Body */}
          {matchedJourneys.map((journey) => {
            const badge = getMatchStatusBadge(journey.matchStatus);
            return (
              <div key={journey.id} className="border-b border-[#f0f1f7] last:border-b-0 px-[20px] py-[20px]">
                <div className="flex gap-[20px] items-center">
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] w-[120px]">
                    {journey.lcuNo}
                  </p>
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] w-[150px]">
                    {journey.journey}
                  </p>
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] flex-1">
                    {journey.transporter}
                  </p>
                  <div className={`px-[12px] py-[6px] rounded-[4px] w-[180px] ${badge.color}`}>
                    <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[14px] text-center">
                      {badge.label}
                    </p>
                  </div>
                  <div className="w-[120px]">
                    {(journey.matchStatus === 'partially-matched' || 
                      journey.matchStatus === 'missing-details' || 
                      journey.matchStatus === 'failed') && (
                      <button
                        onClick={() => onOpenReview(journey)}
                        className="bg-white border border-[#5f697b] px-[16px] py-[8px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors"
                      >
                        <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                          Review
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[12px] justify-end mt-[32px]">
          <button
            onClick={onBack}
            className="bg-white border border-[#5f697b] px-[24px] py-[12px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors"
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
              Back to Listing
            </span>
          </button>
          <button
            className="bg-[#434f64] px-[24px] py-[12px] rounded-[8px] hover:bg-[#5f697b] transition-colors"
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[14px]">
              Submit All Matched
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Trip Review Modal
export function TripReviewModal({ isOpen, onClose, journey, onSubmit }: ReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const checklistItems = [
    { label: 'Origin - Destination', status: 'matched' as const },
    { label: 'POD', status: 'pending' as const },
    { label: 'Invoice Amount', status: 'matched' as const },
  ];

  if (!isOpen || !journey) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-[8px] w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="border-b border-[#d6d6d6] p-[24px] flex items-center justify-between">
          <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[20px]">
            Trip Review - {journey.journey}
          </p>
          <button 
            onClick={onClose}
            className="p-[4px] hover:bg-[#f0f1f7] rounded-[4px] transition-colors"
          >
            <X className="w-[24px] h-[24px] text-[#434343]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#f0f1f7] px-[24px] flex gap-[32px]">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-[12px] border-b-2 transition-colors ${
              activeTab === 'details' 
                ? 'border-[#1890ff] text-[#1890ff]' 
                : 'border-transparent text-[#838c9d]'
            }`}
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px]">
              Details
            </span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-[12px] border-b-2 transition-colors ${
              activeTab === 'audit' 
                ? 'border-[#1890ff] text-[#1890ff]' 
                : 'border-transparent text-[#838c9d]'
            }`}
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px]">
              Audit Trail
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-[24px]">
          {activeTab === 'details' ? (
            <div className="flex flex-col gap-[24px]">
              {/* Checklist */}
              <div>
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[16px] mb-[16px]">
                  Verification Checklist
                </p>
                <div className="border border-[#f0f1f7] rounded-[8px] overflow-hidden">
                  {checklistItems.map((item, index) => {
                    const statusColors = {
                      matched: 'bg-[#f6ffed] text-[#52c41a]',
                      unmatched: 'bg-[#ffeaea] text-[#ff3533]',
                      pending: 'bg-[#ffebdc] text-[#ff6c19]'
                    };
                    return (
                      <div key={index} className={`flex items-center justify-between p-[16px] ${index !== 0 ? 'border-t border-[#f0f1f7]' : ''}`}>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                          {item.label}
                        </p>
                        <div className={`px-[12px] py-[4px] rounded-[4px] ${statusColors[item.status]}`}>
                          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[12px] capitalize">
                            {item.status}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Charge Breakup */}
              <div>
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[16px] mb-[16px]">
                  Charge Breakup
                </p>
                <div className="border border-[#f0f1f7] rounded-[8px] overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-[#f8f8f9] px-[20px] py-[12px] grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-[16px]">
                    <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      CHARGE TYPE
                    </p>
                    <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      CONTRACTED AMT
                    </p>
                    <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      INVOICE AMT
                    </p>
                    <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      VARIANCE (₹)
                    </p>
                    <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ACTION
                    </p>
                  </div>
                  
                  {/* Base Freight Row */}
                  <div className="px-[20px] py-[16px] grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-[16px] border-t border-[#f0f1f7] items-center">
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      Base Freight
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <Check className="w-[16px] h-[16px] text-[#52c41a]" />
                      <span className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#52c41a] text-[14px]">
                        Accepted
                      </span>
                    </div>
                  </div>
                  
                  {/* Additional Charges Row */}
                  <div className="px-[20px] py-[16px] grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-[16px] border-t border-[#f0f1f7] items-center">
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      Additional Charges
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <button className="bg-white border border-[#52c41a] text-[#52c41a] px-[12px] py-[6px] rounded-[4px] hover:bg-[#f6ffed] transition-colors flex items-center gap-[6px]">
                        <Check className="w-[14px] h-[14px]" />
                        <span className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[14px]">
                          Accept
                        </span>
                      </button>
                      <button className="bg-white border border-[#ff3533] text-[#ff3533] px-[12px] py-[6px] rounded-[4px] hover:bg-[#ffeaea] transition-colors flex items-center gap-[6px]">
                        <X className="w-[14px] h-[14px]" />
                        <span className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[14px]">
                          Reject
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {/* GST Row */}
                  <div className="px-[20px] py-[16px] grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-[16px] border-t border-[#f0f1f7] items-center">
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      GST
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                      ₹0
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <button className="bg-white border border-[#52c41a] text-[#52c41a] px-[12px] py-[6px] rounded-[4px] hover:bg-[#f6ffed] transition-colors flex items-center gap-[6px]">
                        <Check className="w-[14px] h-[14px]" />
                        <span className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[14px]">
                          Accept
                        </span>
                      </button>
                      <button className="bg-white border border-[#ff3533] text-[#ff3533] px-[12px] py-[6px] rounded-[4px] hover:bg-[#ffeaea] transition-colors flex items-center gap-[6px]">
                        <X className="w-[14px] h-[14px]" />
                        <span className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[14px]">
                          Reject
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Section */}
              {isRejecting && (
                <div>
                  <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[16px] mb-[12px]">
                    Rejection Reason
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full border border-[#ced1d7] rounded-[8px] p-[12px] font-['Inter:Regular',sans-serif] font-normal text-[#434f64] text-[14px] min-h-[100px] focus:outline-none focus:border-[#1890ff]"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px]">
                Audit trail information will be displayed here...
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#d6d6d6] p-[24px] flex gap-[12px] justify-end">
          {!isRejecting ? (
            <>
              <button
                onClick={onClose}
                className="bg-white border border-[#5f697b] px-[24px] py-[12px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors"
              >
                <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                  Cancel
                </span>
              </button>
              <button
                onClick={() => setIsRejecting(true)}
                className="bg-white border border-[#ff3533] px-[24px] py-[12px] rounded-[8px] hover:bg-[#ffeaea] transition-colors"
              >
                <span className="font-['Inter:Medium',sans-serif] font-medium text-[#ff3533] text-[14px]">
                  Reject
                </span>
              </button>
              <button
                onClick={() => onSubmit('accept')}
                className="bg-[#434f64] px-[24px] py-[12px] rounded-[8px] hover:bg-[#5f697b] transition-colors"
              >
                <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[14px]">
                  Accept
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsRejecting(false)}
                className="bg-white border border-[#5f697b] px-[24px] py-[12px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors"
              >
                <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                  Cancel
                </span>
              </button>
              <button
                onClick={() => onSubmit('reject', rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="bg-[#ff3533] px-[24px] py-[12px] rounded-[8px] hover:bg-[#ff4d4b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[14px]">
                  Confirm Reject
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Confirmation Screen
export function ConfirmationScreen({ onBackToListing }: { onBackToListing: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#f6f8fa] flex items-center justify-center">
      <div className="bg-white rounded-[8px] border border-[#ced1d7] p-[48px] max-w-[600px] w-full mx-[20px]">
        <div className="flex flex-col items-center gap-[24px]">
          <div className="bg-[#f6ffed] rounded-full size-[80px] flex items-center justify-center">
            <Check className="w-[48px] h-[48px] text-[#52c41a]" />
          </div>
          <div className="text-center">
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[24px] mb-[12px]">
              Bulk Review Completed Successfully
            </p>
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mb-[32px]">
              Your bulk upload has been processed and submitted.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-[16px] w-full">
            <div className="bg-[#f6ffed] border border-[#52c41a] rounded-[8px] p-[16px] text-center">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#52c41a] text-[28px] mb-[4px]">
                12
              </p>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#52c41a] text-[14px]">
                Accepted
              </p>
            </div>
            <div className="bg-[#ffeaea] border border-[#ff3533] rounded-[8px] p-[16px] text-center">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#ff3533] text-[28px] mb-[4px]">
                3
              </p>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#ff3533] text-[14px]">
                Rejected
              </p>
            </div>
            <div className="bg-[#ffebdc] border border-[#ff6c19] rounded-[8px] p-[16px] text-center">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#ff6c19] text-[28px] mb-[4px]">
                2
              </p>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#ff6c19] text-[14px]">
                Pending
              </p>
            </div>
          </div>

          <button
            onClick={onBackToListing}
            className="bg-[#434f64] px-[32px] py-[14px] rounded-[8px] hover:bg-[#5f697b] transition-colors w-full"
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[16px]">
              Back to Proforma Listing
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}