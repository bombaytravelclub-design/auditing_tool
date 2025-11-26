import svgPaths from "./svg-046otbd661";

function Cross() {
  return (
    <div className="relative size-[24px]" data-name="Cross">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Cross">
          <path d={svgPaths.p38c06800} fill="var(--fill-0, #434343)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function Modal() {
  return (
    <div className="absolute inset-0 overflow-clip" data-name="Modal">
      <div className="absolute bg-white inset-0 rounded-[8px]" />
      <p className="absolute font-['Inter:Semibold',sans-serif] leading-[1.4] left-[20px] not-italic text-[#434f64] text-[20px] text-nowrap top-[20px] whitespace-pre">Journey Details</p>
      <div className="absolute h-0 left-[20px] right-[20px] top-[64px]">
        <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 759 1">
            <path d="M0 0.5H759" id="Vector 1" stroke="var(--stroke-0, #D6D6D6)" />
          </svg>
        </div>
      </div>
      <div className="absolute flex items-center justify-center right-[20px] size-[24px] top-[20px]">
        <div className="flex-none rotate-[180deg]">
          <Cross />
        </div>
      </div>
      <div className="absolute bg-white bottom-0 h-[63px] left-0 right-0 rounded-bl-[8px] rounded-br-[8px] shadow-[2px_0px_4px_0px_rgba(0,0,0,0.25)]" />
    </div>
  );
}

function Refresh() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Refresh">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Refresh">
          <path d={svgPaths.p3afe3600} fill="var(--fill-0, #1890FF)" id="icon" />
        </g>
      </svg>
    </div>
  );
}

function IconButton() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Icon Button">
      <Refresh />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#1890ff] text-[14px] text-nowrap whitespace-pre">Re-compute</p>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-[750px]">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[16px] text-nowrap whitespace-pre">Freight cost</p>
      <IconButton />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[14px] text-nowrap whitespace-pre">{`Base freight charges `}</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#838c9d] text-[14px] text-nowrap whitespace-pre">₹7,50,000</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] h-[67px] items-start p-[12px] relative rounded-[8px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#ced1d7] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Frame5 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[14px] text-nowrap whitespace-pre">Additional charges</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame1 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#838c9d] text-[14px] text-nowrap whitespace-pre">₹7,50,000</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] h-[67px] items-start p-[12px] relative rounded-[8px] shrink-0 w-[182px]">
      <div aria-hidden="true" className="absolute border border-[#ced1d7] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Frame6 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[14px] text-nowrap whitespace-pre">{`Penalty & Adjustments`}</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame2 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#838c9d] text-[14px] text-nowrap whitespace-pre">₹7,50,000</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] h-[67px] items-start p-[12px] relative rounded-[8px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#ced1d7] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Frame8 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[14px] text-nowrap whitespace-pre">Total Amount</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <Frame3 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#838c9d] text-[14px] text-nowrap whitespace-pre">₹7,50,000</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] h-[67px] items-start p-[12px] relative rounded-[8px] shrink-0 w-[168px]">
      <div aria-hidden="true" className="absolute border border-[#ced1d7] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Frame9 />
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-[749.99px]">
      <Frame7 />
      <Frame11 />
      <Frame12 />
      <Frame10 />
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
      <Frame33 />
      <Frame31 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[4px] h-[19px] items-center relative shrink-0">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#838c9d] text-[14px] text-nowrap whitespace-pre">Base</p>
    </div>
  );
}

function TableHeaderItem() {
  return (
    <div className="bg-[#f8f8f9] h-[40px] relative shrink-0 w-full" data-name="Table header item">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] h-[40px] items-start justify-center px-[8px] py-[15px] relative w-full">
          <Frame15 />
        </div>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#f0f1f7] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[24px] items-center leading-[1.4] not-italic p-[12px] relative text-[#434f64] text-[16px] w-full">
          <p className="relative shrink-0 w-[159.49px]">Freight</p>
          <p className="relative shrink-0 w-[109px]">₹ 213</p>
          <p className="relative shrink-0 w-[89px]">System</p>
        </div>
      </div>
    </div>
  );
}

function Frame27() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <TableHeaderItem />
        <Frame19 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#f0f1f7] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[4px] h-[19px] items-center relative shrink-0">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#838c9d] text-[14px] text-nowrap whitespace-pre">Add-On</p>
    </div>
  );
}

function TableHeaderItem1() {
  return (
    <div className="bg-[#f8f8f9] h-[40px] relative shrink-0 w-full" data-name="Table header item">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] h-[40px] items-start justify-center px-[8px] py-[15px] relative w-full">
          <Frame16 />
        </div>
      </div>
    </div>
  );
}

function Add() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Add">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Add">
          <path d={svgPaths.pf726c00} fill="var(--fill-0, #1890FF)" id="icon" />
        </g>
      </svg>
    </div>
  );
}

function IconButton1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Icon Button">
      <Add />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#1890ff] text-[14px] text-nowrap whitespace-pre">Add additional charges</p>
    </div>
  );
}

function Frame18() {
  return (
    <div className="bg-[#f0f1f7] h-[46px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[24px] h-[46px] items-center p-[12px] relative w-full">
          <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px]">Additional charges</p>
          <IconButton1 />
        </div>
      </div>
    </div>
  );
}

function Frame21() {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#f0f1f7] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[24px] items-center leading-[1.4] not-italic p-[12px] relative text-[#434f64] text-[16px] w-full">
          <p className="relative shrink-0 w-[159.49px]">Loading charges</p>
          <p className="relative shrink-0 w-[109px]">₹ 972</p>
          <p className="relative shrink-0 w-[89px]">System</p>
        </div>
      </div>
    </div>
  );
}

function Frame22() {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#f0f1f7] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[24px] items-center leading-[1.4] not-italic p-[12px] relative text-[#434f64] text-[16px] w-full">
          <p className="relative shrink-0 w-[159.49px]">Unloading charges</p>
          <p className="relative shrink-0 w-[109px]">₹ 972</p>
          <p className="relative shrink-0 w-[89px]">System</p>
        </div>
      </div>
    </div>
  );
}

function Add1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Add">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Add">
          <path d={svgPaths.pf726c00} fill="var(--fill-0, #1890FF)" id="icon" />
        </g>
      </svg>
    </div>
  );
}

function IconButton2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Icon Button">
      <Add1 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#1890ff] text-[14px] text-nowrap whitespace-pre">Add penalty charges</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="bg-[#f0f1f7] h-[46px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[24px] h-[46px] items-center p-[12px] relative w-full">
          <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px]">{`Penalty & Adjustments`}</p>
          <IconButton2 />
        </div>
      </div>
    </div>
  );
}

function Frame26() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
        <TableHeaderItem1 />
        <Frame18 />
        <Frame21 />
        <Frame22 />
        <Frame20 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#f0f1f7] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[16px] text-center text-nowrap whitespace-pre">Charge breakup</p>
      <Frame27 />
      <Frame26 />
    </div>
  );
}

function Add2() {
  return (
    <div className="absolute left-[24.67px] size-[18.667px] top-[24.67px]" data-name="Add">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(67, 79, 100, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 19">
          <g id="Add">
            <rect fill="#434F64" height="18.6667" width="18.6667" />
            <path d={svgPaths.p99fa00} fill="var(--fill-0, white)" id="Union" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[13px] top-[13px]">
      <div className="absolute bg-[#434f64] left-[13px] rounded-[4px] size-[42px] top-[13px]" />
      <Add2 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="h-[68px] relative shrink-0 w-[750px]">
      <div className="absolute bg-white inset-px rounded-[8px]">
        <div aria-hidden="true" className="absolute border-2 border-[#ced1d7] border-dashed inset-[-1px] pointer-events-none rounded-[9px]" />
      </div>
      <Group />
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] left-[62px] not-italic text-[#5f697b] text-[16px] top-[13px] w-[251px]">{`Select file here `}</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[62px] not-italic text-[#838c9d] text-[12px] text-nowrap top-[34px] whitespace-pre">Allowed file type : jpeg,png,jpg,pdf,doc.</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[294px] not-italic text-[#838c9d] text-[12px] text-nowrap top-[34px] whitespace-pre">Max Sixe : 100 mb</p>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] min-w-full not-italic relative shrink-0 text-[#434f64] text-[16px] w-[min-content]">Upload support documents</p>
      <Frame4 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semibold',sans-serif] gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-nowrap w-[177px] whitespace-pre">
      <p className="relative shrink-0 text-[#5f697b] text-[14px]">LCU number</p>
      <p className="relative shrink-0 text-[#434f64] text-[16px]">78912374389070</p>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Semibold',sans-serif] gap-[8px] items-start justify-center leading-[1.4] not-italic relative shrink-0 text-nowrap w-[177px] whitespace-pre">
      <p className="relative shrink-0 text-[#5f697b] text-[14px]">Transporter</p>
      <p className="relative shrink-0 text-[#434f64] text-[16px]">SwiftLine Logistics</p>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[20px] items-start relative shrink-0" data-name="Label">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px] w-full">Origin</p>
    </div>
  );
}

function ReadOnly() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[177px]" data-name="Read only">
      <Label />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] min-w-full not-italic relative shrink-0 text-[#434f64] text-[16px] w-[min-content]">Chennai, TN</p>
    </div>
  );
}

function Label1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[20px] items-start relative shrink-0" data-name="Label">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px] w-full">Destination</p>
    </div>
  );
}

function ReadOnly1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[177px]" data-name="Read only">
      <Label1 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] min-w-full not-italic relative shrink-0 text-[#434f64] text-[16px] w-[min-content]">Hyderabad, TG</p>
    </div>
  );
}

function Label2() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[20px] items-start relative shrink-0" data-name="Label">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px] w-full">Journey number</p>
    </div>
  );
}

function ReadOnly2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[177px]" data-name="Read only">
      <Label2 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] min-w-full not-italic relative shrink-0 text-[#434f64] text-[16px] w-[min-content]">Surface</p>
    </div>
  );
}

function Label3() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[20px] items-start relative shrink-0" data-name="Label">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px] w-full">Pickup date</p>
    </div>
  );
}

function ReadOnly3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[177px]" data-name="Read only">
      <Label3 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] min-w-full not-italic relative shrink-0 text-[#434f64] text-[16px] w-[min-content]">12 Oct, 2024</p>
    </div>
  );
}

function Label4() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[20px] items-start relative shrink-0" data-name="Label">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px] w-full">Material details</p>
    </div>
  );
}

function ReadOnly4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[177px]" data-name="Read only">
      <Label4 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] min-w-full not-italic relative shrink-0 text-[#434f64] text-[16px] w-[min-content]">Refined oil</p>
    </div>
  );
}

function Label5() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] h-[20px] items-start relative shrink-0" data-name="Label">
      <p className="basis-0 font-['Inter:Medium',sans-serif] font-medium grow leading-[1.4] min-h-px min-w-px not-italic relative shrink-0 text-[#5f697b] text-[14px] w-full">Created on</p>
    </div>
  );
}

function ReadOnly5() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[177px]" data-name="Read only">
      <Label5 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] min-w-full not-italic relative shrink-0 text-[#434f64] text-[16px] w-[min-content]">1 Dec, 2024</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-start flex flex-wrap gap-[20px] items-start relative shrink-0 w-full">
      <Frame23 />
      <Frame24 />
      <ReadOnly />
      <ReadOnly1 />
      <ReadOnly2 />
      <ReadOnly3 />
      <ReadOnly4 />
      <ReadOnly5 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex flex-col gap-[28px] items-start relative shrink-0 w-full">
      <p className="font-['Inter:Semibold',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#5f697b] text-[16px] text-center text-nowrap whitespace-pre">LCU details</p>
      <Frame25 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]" style={{ "--stroke-0": "rgba(240, 241, 247, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 750 1">
            <line id="Line 434" stroke="var(--stroke-0, #F0F1F7)" x2="749.99" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Frame14 />
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]" style={{ "--stroke-0": "rgba(240, 241, 247, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 750 1">
            <line id="Line 434" stroke="var(--stroke-0, #F0F1F7)" x2="749.99" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Frame17 />
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]" style={{ "--stroke-0": "rgba(240, 241, 247, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 750 1">
            <line id="Line 434" stroke="var(--stroke-0, #F0F1F7)" x2="749.99" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Frame28 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[749.99px]">
      <Frame29 />
      <Frame30 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-[calc(50%+0.49px)] top-[88px] translate-x-[-50%]">
      <Frame32 />
    </div>
  );
}

export default function AddPod() {
  return (
    <div className="relative size-full" data-name="Add POD 1/1">
      <Modal />
      <Frame13 />
    </div>
  );
}