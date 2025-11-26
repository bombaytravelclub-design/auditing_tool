import { useState } from 'react';
import { X, FileText, ChevronRight } from 'lucide-react';

type TabType = 'summary' | 'needs-review' | 'skipped';

interface PODLoad {
  id: string;
  loadId: string;
  journeyId: string;
  vehicle: string;
  consignee: string;
  attachedDocument: string;
  matchType: 'OCR' | 'Filename';
  confidence: number;
  autoApproval: 'Passed' | 'Failed';
}

interface PODReviewWorkspaceProps {
  onClose: () => void;
  onOpenLoadDetails: (load: PODLoad) => void;
  onSubmitAll: () => void;
}

export function PODReviewWorkspace({ onClose, onOpenLoadDetails, onSubmitAll }: PODReviewWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  const summaryLoads: PODLoad[] = [
    { id: '1', loadId: '2734929', journeyId: '324673-9486478-8484', vehicle: 'KA06ER2233', consignee: 'Maa kaali Distributors', attachedDocument: 'POD_2734929.pdf', matchType: 'OCR', confidence: 95, autoApproval: 'Passed' },
    { id: '2', loadId: '2734930', journeyId: 'SH-92487654321', vehicle: 'TN02AS678', consignee: 'Sai Traders', attachedDocument: 'POD_2734930.jpg', matchType: 'Filename', confidence: 88, autoApproval: 'Passed' },
    { id: '3', loadId: '2734931', journeyId: 'SH-92487654322', vehicle: 'DL07CD4321', consignee: 'Delhi Distributors', attachedDocument: 'POD_2734931.pdf', matchType: 'OCR', confidence: 92, autoApproval: 'Passed' },
  ];

  const needsReviewLoads: PODLoad[] = [
    { id: '4', loadId: '2734932', journeyId: 'SH-92487654323', vehicle: 'MH12EF5678', consignee: 'Mumbai Traders', attachedDocument: 'POD_2734932.pdf', matchType: 'OCR', confidence: 65, autoApproval: 'Failed' },
    { id: '5', loadId: '2734933', journeyId: 'SH-92487654324', vehicle: 'KA01GH7890', consignee: 'Bangalore Logistics', attachedDocument: 'POD_2734933.jpg', matchType: 'Filename', confidence: 58, autoApproval: 'Failed' },
  ];

  const skippedLoads: PODLoad[] = [
    { id: '6', loadId: '2734934', journeyId: 'SH-92487654325', vehicle: 'TN09IJ1234', consignee: 'Chennai Distributors', attachedDocument: 'POD_2734934.pdf', matchType: 'OCR', confidence: 45, autoApproval: 'Failed' },
  ];

  const getCurrentLoads = () => {
    switch (activeTab) {
      case 'summary': return summaryLoads;
      case 'needs-review': return needsReviewLoads;
      case 'skipped': return skippedLoads;
      default: return summaryLoads;
    }
  };

  const loads = getCurrentLoads();

  return (
    <div className="fixed inset-0 z-50 bg-[#f6f8fa] overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-[#d6d6d6] px-[84px] py-[20px] flex items-center justify-between">
        <div>
          <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[20px]">
            Review Workspace
          </p>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mt-[4px]">
            Review matched documents and resolve issues
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-[4px] hover:bg-[#f0f1f7] rounded-[4px] transition-colors"
        >
          <X className="w-[24px] h-[24px] text-[#434343]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#f0f1f7] px-[84px]">
        <div className="flex gap-[32px]">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-[12px] px-[4px] border-b-2 transition-colors ${
              activeTab === 'summary' 
                ? 'border-[#5f697b] text-[#434f64]' 
                : 'border-transparent text-[#838c9d]'
            }`}
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px]">
              Summary ({summaryLoads.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('needs-review')}
            className={`py-[12px] px-[4px] border-b-2 transition-colors ${
              activeTab === 'needs-review' 
                ? 'border-[#5f697b] text-[#434f64]' 
                : 'border-transparent text-[#838c9d]'
            }`}
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px]">
              Needs Review ({needsReviewLoads.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={`py-[12px] px-[4px] border-b-2 transition-colors ${
              activeTab === 'skipped' 
                ? 'border-[#5f697b] text-[#434f64]' 
                : 'border-transparent text-[#838c9d]'
            }`}
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px]">
              Skipped Loads ({skippedLoads.length})
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-[84px] py-[32px]">
        <div className="bg-white rounded-[8px] border border-[#ced1d7] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#434f64] px-[20px] py-[14px]">
            <div className="grid grid-cols-[140px_180px_140px_180px_120px_120px_140px_100px] gap-[16px]">
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Load ID / Journey ID
              </p>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Vehicle
              </p>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Consignee
              </p>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Attached Document
              </p>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Match Type
              </p>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Confidence
              </p>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Auto-Approval
              </p>
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-white text-[14px]">
                Action
              </p>
            </div>
          </div>

          {/* Table Body */}
          {loads.map((load, index) => (
            <div 
              key={load.id} 
              className={`px-[20px] py-[16px] ${index !== loads.length - 1 ? 'border-b border-[#f0f1f7]' : ''}`}
            >
              <div className="grid grid-cols-[140px_180px_140px_180px_120px_120px_140px_100px] gap-[16px] items-center">
                {/* Load ID / Journey ID */}
                <div>
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px]">
                    {load.loadId}
                  </p>
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[12px] mt-[4px]">
                    {load.journeyId}
                  </p>
                </div>

                {/* Vehicle */}
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px]">
                  {load.vehicle}
                </p>

                {/* Consignee */}
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px]">
                  {load.consignee}
                </p>

                {/* Attached Document */}
                <div className="flex items-center gap-[8px]">
                  <FileText className="w-[16px] h-[16px] text-[#ff3533]" />
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                    {load.attachedDocument}
                  </p>
                </div>

                {/* Match Type */}
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                  {load.matchType}
                </p>

                {/* Confidence */}
                <p className={`font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[14px] ${
                  load.confidence >= 90 ? 'text-[#52c41a]' : load.confidence >= 70 ? 'text-[#ff6c19]' : 'text-[#ff3533]'
                }`}>
                  {load.confidence}%
                </p>

                {/* Auto-Approval */}
                <div className={`flex items-center gap-[6px] px-[8px] py-[4px] rounded-[4px] ${
                  load.autoApproval === 'Passed' ? 'bg-[#f6ffed]' : 'bg-[#ffeaea]'
                }`}>
                  <div className={`size-[8px] rounded-full ${
                    load.autoApproval === 'Passed' ? 'bg-[#52c41a]' : 'bg-[#ff3533]'
                  }`} />
                  <span className={`font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[12px] ${
                    load.autoApproval === 'Passed' ? 'text-[#52c41a]' : 'text-[#ff3533]'
                  }`}>
                    {load.autoApproval}
                  </span>
                </div>

                {/* Action */}
                <button
                  onClick={() => onOpenLoadDetails(load)}
                  className="flex items-center gap-[6px] text-[#1890ff] hover:text-[#40a9ff] transition-colors"
                >
                  <span className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[14px]">
                    Change
                  </span>
                  <ChevronRight className="w-[16px] h-[16px]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
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
            onClick={onSubmitAll}
            className="bg-[#434f64] px-[24px] py-[12px] rounded-[8px] hover:bg-[#5f697b] transition-colors"
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[14px]">
              Submit All
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Load Details Side Panel
interface LoadDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  load: PODLoad | null;
}

export function LoadDetailsPanel({ isOpen, onClose, load }: LoadDetailsPanelProps) {
  if (!isOpen || !load) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />
      <div className="relative bg-white w-[400px] h-full overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-[24px] border-b border-[#d6d6d6] flex items-center justify-between">
          <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[18px]">
            Load Details
          </p>
          <button
            className="bg-[#434f64] px-[16px] py-[8px] rounded-[6px] hover:bg-[#5f697b] transition-colors"
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[14px]">
              Show Menu
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-[24px]">
          {/* Load ID */}
          <div className="mb-[20px]">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mb-[4px]">
              Load ID
            </p>
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[16px]">
              {load.loadId}
            </p>
          </div>

          {/* Vehicle */}
          <div className="mb-[20px]">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mb-[4px]">
              Vehicle
            </p>
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[16px]">
              {load.vehicle}
            </p>
          </div>

          {/* Consignee */}
          <div className="mb-[24px]">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mb-[4px]">
              Consignee
            </p>
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[16px]">
              {load.consignee}
            </p>
          </div>

          {/* Document Preview */}
          <div className="mb-[24px]">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mb-[12px]">
              Document Preview
            </p>
            <div className="bg-[#f6f8fa] border border-[#ced1d7] rounded-[8px] p-[48px] flex flex-col items-center justify-center">
              <FileText className="w-[64px] h-[64px] text-[#838c9d] mb-[16px]" />
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
                {load.attachedDocument}
              </p>
            </div>
          </div>

          {/* OCR Extracted Fields */}
          <div className="mb-[24px]">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px] mb-[12px]">
              OCR Extracted Fields
            </p>
            <div className="bg-[#f6f8fa] border border-[#ced1d7] rounded-[8px] p-[16px] space-y-[12px]">
              <div className="flex justify-between items-center">
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px]">
                  Vehicle Number:
                </p>
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px]">
                  {load.vehicle}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px]">
                  Load ID:
                </p>
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px]">
                  {load.loadId}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[14px]">
                  Confidence:
                </p>
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#52c41a] text-[14px]">
                  {load.confidence}%
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-[12px]">
            <button className="w-full bg-[#434f64] px-[24px] py-[12px] rounded-[8px] hover:bg-[#5f697b] transition-colors">
              <span className="font-['Inter:Medium',sans-serif] font-medium text-white text-[14px]">
                Attach
              </span>
            </button>
            <button className="w-full bg-white border border-[#5f697b] px-[24px] py-[12px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors">
              <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                Replace
              </span>
            </button>
            <button className="w-full px-[24px] py-[12px] rounded-[8px] hover:bg-[#ffeaea] transition-colors">
              <span className="font-['Inter:Medium',sans-serif] font-medium text-[#ff3533] text-[14px]">
                Skip Load
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}