import { useState } from 'react';
import svgPaths from "./imports/svg-l9irbmjdv5";
import svgPathsPanel from "./imports/svg-046otbd661";
import imgImage5 from "figma:asset/231f6c07ccc66da68efb5ea98d508fad94ccda02.png";
import { imgImage4 } from "./imports/svg-l9inz";
import { ChevronDown, ChevronUp, CheckCircle, X, Upload, FileText, Loader2, AlertCircle, Check } from 'lucide-react';

type CardType = 'closed' | 'disputed' | 'ongoing';
type ScreenType = 'listing' | 'file-upload' | 'processing' | 'review-workspace' | 'summary' | 'confirmation';
type UploadType = 'pod' | 'invoice' | null;

interface JourneyData {
  id: string;
  lcuNo: string;
  date: string;
  journey: string;
  transporter: string;
  baseCharge: string;
  addonCharges: string;
  totalAmount: string;
  status: string;
  statusColor: string;
  selected?: boolean;
}

interface MatchedJourney extends JourneyData {
  matchStatus: 'matched' | 'partially-matched' | 'missing-details' | 'failed';
}

function Inbound() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Inbound">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Inbound">
          <path d={svgPaths.p1ff6d900} fill="var(--fill-0, #434343)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function Frame17() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center left-[88px] top-[12px]">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[42px] not-italic relative shrink-0 text-[#434343] text-[20px] text-nowrap whitespace-pre">Proforma invoice</p>
    </div>
  );
}

function UpperNavigation() {
  return (
    <div className="absolute bg-[#fefefe] h-[66px] left-0 top-0 w-[1440px]" data-name="Upper Navigation">
      <div aria-hidden="true" className="absolute border border-neutral-100 border-solid inset-0 pointer-events-none" />
      <Frame17 />
      <div className="absolute inset-0 pointer-events-none shadow-[0px_-1px_0px_0px_inset_rgba(169,169,169,0.25)]" />
    </div>
  );
}

function BxsChevronDown() {
  return (
    <div className="absolute right-[8px] size-[16px] top-[12px]" data-name="bxs:chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="bxs:chevron-down">
          <path d={svgPaths.p3ea02200} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white h-[40px] relative rounded-[8px] shrink-0 w-[317px]">
      <div aria-hidden="true" className="absolute border border-[#ced1d7] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[28.75%_27.86%_28.75%_5.71%] leading-[normal] not-italic text-[#434343] text-[14px]">Transporter (53)</p>
      <BxsChevronDown />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute left-0 size-[16px] top-0" />
    </div>
  );
}

function Calendar() {
  return (
    <div className="absolute right-[12px] size-[16px] top-[12px]" data-name="Calendar">
      <Group1 />
      <div className="absolute inset-[9.38%_12.5%_12.5%_12.5%]" data-name="Union">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 13">
          <g id="Union">
            <path d={svgPaths.p103d8980} fill="var(--fill-0, #8B8B8B)" />
            <path clipRule="evenodd" d={svgPaths.p2742270} fill="var(--fill-0, #8B8B8B)" fillRule="evenodd" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function DatePicker() {
  return (
    <div className="h-[41px] relative shrink-0 w-[317px]" data-name="Date Picker">
      <div className="absolute bg-white h-[41px] left-0 right-0 rounded-[8px] top-0">
        <div aria-hidden="true" className="absolute border border-[#ced1d7] border-solid inset-0 pointer-events-none rounded-[8px]" />
      </div>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[8px] not-italic text-[#434343] text-[14px] text-nowrap top-[12px] whitespace-pre">April 2025 (current)</p>
      <Calendar />
    </div>
  );
}

function Frame18() {
  return (
    <div className="absolute content-stretch flex gap-[20px] items-center left-[84px] top-[82px]">
      <Frame1 />
      <DatePicker />
    </div>
  );
}

function Frame60() {
  return (
    <div className="relative shrink-0 size-[32px]">
      <div className="absolute left-0 size-[32px] top-0">
        <div className="absolute inset-0" style={{ "--fill-0": "rgba(240, 241, 247, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <circle cx="16" cy="16" fill="var(--fill-0, #F0F1F7)" id="Ellipse 1397" r="16" />
          </svg>
        </div>
      </div>
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] left-[8px] not-italic text-[#434f64] text-[14px] text-nowrap top-[6.5px] whitespace-pre">07</p>
    </div>
  );
}

interface CardProps {
  label: string;
  amount: string;
  onClick: () => void;
  isActive: boolean;
}

function StatusCard({ label, amount, onClick, isActive }: CardProps) {
  return (
    <div 
      className={`bg-white box-border content-stretch flex gap-[20px] h-[67px] items-center p-[12px] relative rounded-[8px] shrink-0 w-[317px] cursor-pointer transition-all ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div aria-hidden="true" className={`absolute border ${isActive ? 'border-blue-500' : 'border-[#ced1d7]'} border-solid inset-0 pointer-events-none rounded-[8px]`} />
      <Frame60 />
      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[14px] text-nowrap whitespace-pre">{label}</p>
        </div>
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#434f64] text-[16px] text-nowrap whitespace-pre">{amount}</p>
      </div>
    </div>
  );
}

function Frame14({ activeCard, onCardClick }: { activeCard: CardType; onCardClick: (card: CardType) => void }) {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-[1328px]">
      <StatusCard 
        label="Closed" 
        amount="₹7,50,000" 
        onClick={() => onCardClick('closed')}
        isActive={activeCard === 'closed'}
      />
      <StatusCard 
        label="Disputed" 
        amount="₹0" 
        onClick={() => onCardClick('disputed')}
        isActive={activeCard === 'disputed'}
      />
      <StatusCard 
        label="On Going Trips" 
        amount="₹7,50,000" 
        onClick={() => onCardClick('ongoing')}
        isActive={activeCard === 'ongoing'}
      />
    </div>
  );
}

interface SubFiltersProps {
  activeCard: CardType;
  activeSubFilter: string | null;
  onSubFilterClick: (filter: string | null) => void;
}

function SubFilters({ activeCard, activeSubFilter, onSubFilterClick }: SubFiltersProps) {
  const filters = {
    closed: ['ePOD Approved', 'ePOD Pending'],
    disputed: ['Rejected', 'Review Pending', 'Re-Upload Supporting Doc'],
    ongoing: []
  };

  const currentFilters = filters[activeCard];

  if (currentFilters.length === 0) return null;

  return (
    <div className="flex gap-[12px] items-center mb-[20px]">
      {currentFilters.map((filter) => (
        <button
          key={filter}
          onClick={() => onSubFilterClick(filter)}
          className={`px-[16px] py-[8px] rounded-[8px] border transition-colors ${
            activeSubFilter === filter 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white text-[#434f64] border-[#ced1d7] hover:border-blue-300'
          }`}
        >
          <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px]">{filter}</span>
        </button>
      ))}
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative shrink-0 size-[16px] rounded-[4px] transition-colors ${
        checked ? 'bg-[#1890ff] border-[#1890ff]' : 'bg-[#f6f6f6] border-[#d6d6d6]'
      }`}
      data-name="Checkbox"
    >
      <div aria-hidden="true" className={`absolute border ${checked ? 'border-[#1890ff]' : 'border-[#d6d6d6]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
      {checked && (
        <Check className="w-[12px] h-[12px] text-white absolute inset-0 m-auto" strokeWidth={3} />
      )}
    </button>
  );
}

function ChevronRight() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="chevron-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="chevron-right">
          <path clipRule="evenodd" d={svgPaths.p37a40200} fill="var(--fill-0, #5F697B)" fillRule="evenodd" id="icon" />
        </g>
      </svg>
    </div>
  );
}

function TableHeader({ allSelected, onSelectAll }: { allSelected: boolean; onSelectAll: () => void }) {
  return (
    <div className="relative w-full mb-[12px]">
      <div className="box-border content-stretch flex gap-[20px] items-center px-[12px] py-[16px]">
        <Checkbox checked={allSelected} onChange={onSelectAll} />
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[94px]">LCU NO</p>
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[134px]">Journey</p>
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[134px]">Transporter</p>
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[134px]">Base charge</p>
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[134px]">Add-on charges</p>
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[134px]">Total amount</p>
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[134px]">Status</p>
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px] w-[40px]">Actions</p>
      </div>
    </div>
  );
}

function TableRow({ 
  lcuNo, 
  date, 
  journey, 
  transporter, 
  baseCharge, 
  addonCharges, 
  totalAmount, 
  status, 
  statusColor,
  isSelected,
  onToggleSelect,
  onRowClick
}: {
  lcuNo: string;
  date: string;
  journey: string;
  transporter: string;
  baseCharge: string;
  addonCharges: string;
  totalAmount: string;
  status: string;
  statusColor: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRowClick: () => void;
}) {
  return (
    <div className="relative shrink-0 w-full border-b border-[#f0f1f7]">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center px-[12px] py-[24px] relative w-full">
          <Checkbox checked={isSelected} onChange={onToggleSelect} />
          <div className="content-stretch flex flex-col gap-[8px] items-start leading-[1.4] not-italic text-[14px] w-[94px]">
            <p className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64]">{lcuNo}</p>
            <p className="font-['Inter:Regular',sans-serif] font-normal text-[#838c9d]">{date}</p>
          </div>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] w-[134px]">{journey}</p>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] w-[134px]">{transporter}</p>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] w-[134px]">{baseCharge}</p>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] w-[134px]">{addonCharges}</p>
          <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#434f64] text-[14px] w-[134px]">{totalAmount}</p>
          <div className={`box-border content-stretch flex gap-[8px] items-center justify-center px-[8px] py-[2px] rounded-[4px] w-[134px] ${statusColor}`}>
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[14px] text-nowrap whitespace-pre">{status}</p>
          </div>
          <button 
            onClick={onRowClick}
            className="bg-white box-border content-stretch flex gap-[8px] items-center justify-center p-[12px] rounded-[8px] w-[40px] relative hover:bg-[#f8f8f9] transition-colors"
          >
            <div aria-hidden="true" className="absolute border border-[#5f697b] border-solid inset-0 pointer-events-none rounded-[8px]" />
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}

// Journey Details Side Panel Components
interface CollapsibleCardProps {
  title: string;
  statusText: string;
  statusColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleCard({ title, statusText, statusColor, isExpanded, onToggle, children }: CollapsibleCardProps) {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full bg-white">
      <div aria-hidden="true" className="absolute border border-[#f0f1f7] border-solid inset-0 pointer-events-none rounded-[8px]" />
      
      <button
        onClick={onToggle}
        className="w-full box-border flex items-center justify-between p-[16px] cursor-pointer hover:bg-[#f8f8f9] transition-colors rounded-t-[8px]"
      >
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[16px]">
          {title}
        </p>
        <div className="flex items-center gap-[12px]">
          <div className={`px-[8px] py-[4px] rounded-[4px] ${statusColor}`}>
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[12px]">
              {statusText}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-[20px] h-[20px] text-[#5f697b]" />
          ) : (
            <ChevronDown className="w-[20px] h-[20px] text-[#5f697b]" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-[#f0f1f7] p-[16px]">
          {children}
        </div>
      )}
    </div>
  );
}

function PODDetailsContent() {
  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-center gap-[12px]">
        <CheckCircle className="w-[20px] h-[20px] text-[#52c41a]" />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[14px]">
          Delivery completed on 15 Dec 2024
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-[12px]">
        <div className="w-[200px] h-[200px] border border-[#ced1d7] rounded-[8px] bg-[#f8f8f9] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-[48px] h-[48px] mx-auto mb-[8px] text-[#838c9d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[12px]">
              POD Preview
            </p>
          </div>
        </div>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#838c9d] text-[12px]">
          POD_image.png
        </p>
      </div>
    </div>
  );
}

function MaterialDetailsContent() {
  return (
    <div className="content-start flex flex-wrap gap-[20px] items-start w-full">
      <div className="content-stretch flex flex-col gap-[8px] items-start w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Material Name
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          Refined oil
        </p>
      </div>
      
      <div className="content-stretch flex flex-col gap-[8px] items-start w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Quantity
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          500 units
        </p>
      </div>
      
      <div className="content-stretch flex flex-col gap-[8px] items-start w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Weight
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          2500 kg
        </p>
      </div>
      
      <div className="content-stretch flex flex-col gap-[8px] items-start w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Volume
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          15 m³
        </p>
      </div>
      
      <div className="content-stretch flex flex-col gap-[8px] items-start w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Package Type
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          Drums
        </p>
      </div>
      
      <div className="content-stretch flex flex-col gap-[8px] items-start w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Material Code
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          MAT-2024-089
        </p>
      </div>
    </div>
  );
}

function LCUDetailsContent() {
  return (
    <div className="flex flex-wrap gap-[20px]">
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          LCU number
        </p>
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[16px]">
          78912374389070
        </p>
      </div>
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Transporter
        </p>
        <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[16px]">
          SwiftLine Logistics
        </p>
      </div>
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Origin
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          Chennai, TN
        </p>
      </div>
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Destination
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          Hyderabad, TG
        </p>
      </div>
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Journey number
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          Surface
        </p>
      </div>
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Pickup date
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          12 Oct, 2024
        </p>
      </div>
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Material details
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          Refined oil
        </p>
      </div>
      <div className="flex flex-col gap-[8px] w-[177px]">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.4] not-italic text-[#5f697b] text-[14px]">
          Created on
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
          1 Dec, 2024
        </p>
      </div>
    </div>
  );
}

function JourneyDetailsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isPODExpanded, setIsPODExpanded] = useState(false);
  const [isMaterialExpanded, setIsMaterialExpanded] = useState(false);
  const [isLCUExpanded, setIsLCUExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="relative bg-white h-full w-[800px] shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#d6d6d6] p-[20px] flex items-center justify-between z-10">
          <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#434f64] text-[20px]">
            Journey Details
          </p>
          <button 
            onClick={onClose}
            className="p-[4px] hover:bg-[#f0f1f7] rounded-[4px] transition-colors"
          >
            <X className="w-[24px] h-[24px] text-[#434343]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-[20px] flex flex-col gap-[24px]">
          {/* Freight Cost Section */}
          <div className="flex flex-col gap-[20px]">
            <div className="flex gap-[16px] items-center">
              <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[16px]">
                Freight cost
              </p>
              <div className="flex gap-[4px] items-center cursor-pointer">
                <div className="relative shrink-0 size-[16px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                    <path d={svgPathsPanel.p3afe3600} fill="#1890FF" />
                  </svg>
                </div>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic text-[#1890ff] text-[14px]">
                  Re-compute
                </p>
              </div>
            </div>

            <div className="flex gap-[16px] flex-wrap">
              <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[12px] flex-1 min-w-[150px]">
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[4px]">
                  Base freight charges
                </p>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px]">
                  ₹7,50,000
                </p>
              </div>
              <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[12px] flex-1 min-w-[150px]">
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[4px]">
                  Additional charges
                </p>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px]">
                  ₹7,50,000
                </p>
              </div>
              <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[12px] flex-1 min-w-[150px]">
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[4px]">
                  Penalty & Adjustments
                </p>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px]">
                  ₹7,50,000
                </p>
              </div>
              <div className="bg-white border border-[#ced1d7] rounded-[8px] p-[12px] flex-1 min-w-[150px]">
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[14px] mb-[4px]">
                  Total Amount
                </p>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#838c9d] text-[14px]">
                  ₹7,50,000
                </p>
              </div>
            </div>
          </div>

          {/* POD Details */}
          <CollapsibleCard
            title="POD Details"
            statusText="Available"
            statusColor="bg-[#e6f7ff] text-[#1890ff]"
            isExpanded={isPODExpanded}
            onToggle={() => setIsPODExpanded(!isPODExpanded)}
          >
            <PODDetailsContent />
          </CollapsibleCard>

          {/* Charge Breakup */}
          <div className="flex flex-col gap-[16px]">
            <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#5f697b] text-[16px]">
              Charge breakup
            </p>
            <div className="border border-[#f0f1f7] rounded-[8px] overflow-hidden">
              <div className="bg-[#f8f8f9] p-[12px]">
                <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic text-[#838c9d] text-[14px]">
                  Base
                </p>
              </div>
              <div className="p-[12px] border-b border-[#f0f1f7]">
                <div className="flex gap-[24px] font-['Inter:Regular',sans-serif] font-normal leading-[1.4] not-italic text-[#434f64] text-[16px]">
                  <p className="w-[160px]">Freight</p>
                  <p className="w-[110px]">₹ 213</p>
                  <p className="w-[90px]">System</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Documents */}
          <div className="flex flex-col gap-[20px]">
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#434f64] text-[16px]">
              Upload support documents
            </p>
            <div className="border-2 border-dashed border-[#ced1d7] rounded-[8px] p-[12px] bg-white flex items-center gap-[12px]">
              <div className="bg-[#434f64] rounded-[4px] size-[42px] flex items-center justify-center">
                <svg className="w-[20px] h-[20px]" fill="white" viewBox="0 0 19 19">
                  <path d={svgPathsPanel.p99fa00} />
                </svg>
              </div>
              <div>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#5f697b] text-[16px]">
                  Select file here
                </p>
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic text-[#838c9d] text-[12px]">
                  Allowed file type : jpeg,png,jpg,pdf,doc. Max Size : 100 mb
                </p>
              </div>
            </div>
          </div>

          {/* Material Details */}
          <CollapsibleCard
            title="Material Details"
            statusText="Matched"
            statusColor="bg-[#f6ffed] text-[#52c41a]"
            isExpanded={isMaterialExpanded}
            onToggle={() => setIsMaterialExpanded(!isMaterialExpanded)}
          >
            <MaterialDetailsContent />
          </CollapsibleCard>

          {/* LCU Details */}
          <CollapsibleCard
            title="LCU Details"
            statusText="Available"
            statusColor="bg-[#e6f7ff] text-[#1890ff]"
            isExpanded={isLCUExpanded}
            onToggle={() => setIsLCUExpanded(!isLCUExpanded)}
          >
            <LCUDetailsContent />
          </CollapsibleCard>
        </div>
      </div>
    </div>
  );
}

export default function FreightInvoiceScreen() {
  const [activeCard, setActiveCard] = useState<CardType>('closed');
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('listing');
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [selectedJourneys, setSelectedJourneys] = useState<string[]>([]);
  const [reviewJourney, setReviewJourney] = useState<MatchedJourney | null>(null);
  const [selectedPODLoad, setSelectedPODLoad] = useState<any>(null);
  const [isLoadDetailsPanelOpen, setIsLoadDetailsPanelOpen] = useState(false);

  const handleCardClick = (card: CardType) => {
    setActiveCard(card);
    setActiveSubFilter(null);
  };

  const handleSubFilterClick = (filter: string | null) => {
    setActiveSubFilter(filter);
  };

  const handleRowClick = () => {
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleBulkUploadClick = (type: 'pod' | 'invoice') => {
    setUploadType(type);
    setCurrentScreen('file-upload');
  };

  const handleUploadFiles = () => {
    setCurrentScreen('processing');
    setTimeout(() => {
      // For POD uploads, go to review workspace; for invoices, go to summary
      if (uploadType === 'pod') {
        setCurrentScreen('review-workspace');
      } else {
        setCurrentScreen('summary');
      }
    }, 2000);
  };

  const handleBackToListing = () => {
    setCurrentScreen('listing');
    setUploadType(null);
    setSelectedJourneys([]);
    setReviewJourney(null);
  };

  const handleOpenReview = (journey: MatchedJourney) => {
    setReviewJourney(journey);
  };

  const handleCloseReview = () => {
    setReviewJourney(null);
  };

  const handleSubmitReview = (action: 'accept' | 'reject', reason?: string) => {
    console.log('Review submitted:', action, reason);
    setReviewJourney(null);
    // Could show confirmation or update state
  };

  const hasSelectedJourneys = selectedJourneys.length > 0;

  // Import the workflow components
  const BulkFileUploadScreen = require('./components/BulkUploadWorkflow').BulkFileUploadScreen;
  const ProcessingScreen = require('./components/BulkUploadWorkflow').ProcessingScreen;
  const BulkUploadSummaryScreen = require('./components/BulkUploadWorkflow').BulkUploadSummaryScreen;
  const TripReviewModal = require('./components/BulkUploadWorkflow').TripReviewModal;
  const ConfirmationScreen = require('./components/BulkUploadWorkflow').ConfirmationScreen;
  const PODReviewWorkspace = require('./components/PODReviewWorkspace').PODReviewWorkspace;
  const LoadDetailsPanel = require('./components/PODReviewWorkspace').LoadDetailsPanel;

  // Render different screens based on current state
  if (currentScreen === 'file-upload' && uploadType) {
    return <BulkFileUploadScreen uploadType={uploadType} onClose={handleBackToListing} onUpload={handleUploadFiles} />;
  }

  if (currentScreen === 'processing' && uploadType) {
    return <ProcessingScreen uploadType={uploadType} />;
  }

  if (currentScreen === 'review-workspace' && uploadType === 'pod') {
    return (
      <>
        <PODReviewWorkspace 
          onClose={handleBackToListing}
          onOpenLoadDetails={(load) => {
            setSelectedPODLoad(load);
            setIsLoadDetailsPanelOpen(true);
          }}
          onSubmitAll={() => {
            setCurrentScreen('confirmation');
          }}
        />
        <LoadDetailsPanel 
          isOpen={isLoadDetailsPanelOpen}
          onClose={() => setIsLoadDetailsPanelOpen(false)}
          load={selectedPODLoad}
        />
      </>
    );
  }

  if (currentScreen === 'summary' && uploadType) {
    return (
      <>
        <BulkUploadSummaryScreen uploadType={uploadType} onBack={handleBackToListing} onOpenReview={handleOpenReview} />
        <TripReviewModal 
          isOpen={!!reviewJourney} 
          onClose={handleCloseReview} 
          journey={reviewJourney} 
          onSubmit={handleSubmitReview}
        />
      </>
    );
  }

  if (currentScreen === 'confirmation') {
    return <ConfirmationScreen onBackListing={handleBackToListing} />;
  }

  return (
    <div className="bg-[#f6f8fa] overflow-hidden relative w-[1440px]" style={{ height: "1024px" }}>
      <UpperNavigation />
      <Frame18 />
      
      <div className="absolute content-stretch flex gap-[20px] items-start left-[84px] top-[136px] w-[1328px]">
        <Frame14 activeCard={activeCard} onCardClick={handleCardClick} />
      </div>

      <div className="absolute left-[84px] top-[223px] w-[1328px]">
        <SubFilters 
          activeCard={activeCard} 
          activeSubFilter={activeSubFilter}
          onSubFilterClick={handleSubFilterClick}
        />
        
        <div className="flex justify-between items-center mb-[16px]">
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic text-[#434f64] text-[14px]">
            130 Journey available
          </p>
          
          {/* Bulk Action Buttons - Conditional rendering based on sub-filter */}
          <div className="flex gap-[12px]">
            {/* Show Bulk Upload POD only when ePOD Pending is selected */}
            {activeCard === 'closed' && activeSubFilter === 'ePOD Pending' && (
              <button
                onClick={() => handleBulkUploadClick('pod')}
                disabled={!hasSelectedJourneys}
                className="bg-white border border-[#5f697b] px-[16px] py-[10px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[8px]"
              >
                <Upload className="w-[16px] h-[16px] text-[#434f64]" />
                <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                  Bulk Upload POD
                </span>
              </button>
            )}
            
            {/* Show Bulk Upload Invoice only when ePOD Approved is selected */}
            {activeCard === 'closed' && activeSubFilter === 'ePOD Approved' && (
              <button
                onClick={() => handleBulkUploadClick('invoice')}
                disabled={!hasSelectedJourneys}
                className="bg-white border border-[#5f697b] px-[16px] py-[10px] rounded-[8px] hover:bg-[#f8f8f9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[8px]"
              >
                <Upload className="w-[16px] h-[16px] text-[#434f64]" />
                <span className="font-['Inter:Medium',sans-serif] font-medium text-[#434f64] text-[14px]">
                  Bulk Upload Invoice
                </span>
              </button>
            )}
          </div>
        </div>

        <TableHeader 
          allSelected={selectedJourneys.length > 0}
          onSelectAll={() => {
            if (selectedJourneys.length > 0) {
              setSelectedJourneys([]);
            } else {
              setSelectedJourneys(['TN09 RE3476', 'TN09 RE1234', 'TN09 RE9101', 'TN09 RE5678', 'TN09 RE1121']);
            }
          }}
        />
        
        <div className="content-stretch flex flex-col items-start w-full">
          <TableRow 
            lcuNo="TN09 RE3476"
            date="10 Sep 2024"
            journey="JY20230900"
            transporter="BLR logistics"
            baseCharge="₹0"
            addonCharges="₹0"
            totalAmount="₹0"
            status="Missing details"
            statusColor="bg-[#ffeaea] text-[#ff3533]"
            isSelected={selectedJourneys.includes('TN09 RE3476')}
            onToggleSelect={() => {
              if (selectedJourneys.includes('TN09 RE3476')) {
                setSelectedJourneys(selectedJourneys.filter(id => id !== 'TN09 RE3476'));
              } else {
                setSelectedJourneys([...selectedJourneys, 'TN09 RE3476']);
              }
            }}
            onRowClick={handleRowClick}
          />
          <TableRow 
            lcuNo="TN09 RE1234"
            date="10 Sep 2024"
            journey="JY20230901"
            transporter="ABC transporters"
            baseCharge="₹50,000"
            addonCharges="₹2489"
            totalAmount="₹50,000"
            status="Yet to raise"
            statusColor="bg-[#ffebdc] text-[#ff6c19]"
            isSelected={selectedJourneys.includes('TN09 RE1234')}
            onToggleSelect={() => {
              if (selectedJourneys.includes('TN09 RE1234')) {
                setSelectedJourneys(selectedJourneys.filter(id => id !== 'TN09 RE1234'));
              } else {
                setSelectedJourneys([...selectedJourneys, 'TN09 RE1234']);
              }
            }}
            onRowClick={handleRowClick}
          />
          <TableRow 
            lcuNo="TN09 RE9101"
            date="10 Sep 2024"
            journey="JY20230903"
            transporter="BLR logistics"
            baseCharge="₹50,000"
            addonCharges="₹0"
            totalAmount="₹50,000"
            status="Yet to raise"
            statusColor="bg-[#ffebdc] text-[#ff6c19]"
            isSelected={selectedJourneys.includes('TN09 RE9101')}
            onToggleSelect={() => {
              if (selectedJourneys.includes('TN09 RE9101')) {
                setSelectedJourneys(selectedJourneys.filter(id => id !== 'TN09 RE9101'));
              } else {
                setSelectedJourneys([...selectedJourneys, 'TN09 RE9101']);
              }
            }}
            onRowClick={handleRowClick}
          />
          <TableRow 
            lcuNo="TN09 RE5678"
            date="10 Sep 2024"
            journey="JY20230902"
            transporter="XYZ logistics"
            baseCharge="₹50,000"
            addonCharges="₹400"
            totalAmount="₹50,000"
            status="Ongoing trip"
            statusColor="bg-[#ffeaea] text-[#ff3533]"
            isSelected={selectedJourneys.includes('TN09 RE5678')}
            onToggleSelect={() => {
              if (selectedJourneys.includes('TN09 RE5678')) {
                setSelectedJourneys(selectedJourneys.filter(id => id !== 'TN09 RE5678'));
              } else {
                setSelectedJourneys([...selectedJourneys, 'TN09 RE5678']);
              }
            }}
            onRowClick={handleRowClick}
          />
          <TableRow 
            lcuNo="TN09 RE1121"
            date="10 Sep 2024"
            journey="JY20230904"
            transporter="BLR logistics"
            baseCharge="₹50,000"
            addonCharges="₹390"
            totalAmount="₹50,000"
            status="Yet to raise"
            statusColor="bg-[#ffebdc] text-[#ff6c19]"
            isSelected={selectedJourneys.includes('TN09 RE1121')}
            onToggleSelect={() => {
              if (selectedJourneys.includes('TN09 RE1121')) {
                setSelectedJourneys(selectedJourneys.filter(id => id !== 'TN09 RE1121'));
              } else {
                setSelectedJourneys([...selectedJourneys, 'TN09 RE1121']);
              }
            }}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Journey Details Side Panel */}
      <JourneyDetailsPanel isOpen={isPanelOpen} onClose={handleClosePanel} />
    </div>
  );
}