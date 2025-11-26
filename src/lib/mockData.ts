export interface Journey {
  id: string;
  lcuNo: string;
  journeyNo: string;
  lrNo: string;
  transporter: string;
  origin: string;
  destination: string;
  baseCharges: number;
  addonCharges: number;
  totalAmount: number;
  status: "Missing details" | "Yet to raise" | "In Audit" | "Settled" | "Approved" | "Pending";
  category: "ePOD Approved" | "ePOD Pending" | "Disputed" | "Rejected" | "Open Trips";
  pickupDate: string;
  deliveryDate?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  materialType?: string;
  consigneeName?: string;
  paymentMode?: "Prepaid" | "To-pay" | "TBB";
  contractType?: "Spot" | "Rate Card";
  materials?: Material[];
  charges?: ChargeWithGST[];
  podDocuments?: Document[];
  invoiceDocuments?: Document[];
}

export interface Material {
  id: string;
  item: string;
  description: string;
  quantity: number;
  uom: string;
  weight: number;
}

export interface Charge {
  id: string;
  type: string;
  amount: number;
  source: "System" | "Manual";
  category: "Base" | "Add-on" | "Penalty";
}

export interface ChargeWithGST extends Charge {
  gstApplicable: boolean;
  gstPercent?: number;
  totalWithGST?: number;
  comments?: string;
}

export interface Document {
  id: string;
  filename: string;
  uploadDate: string;
  uploadedBy: string;
  status: "Approved" | "Pending" | "Rejected";
  url?: string;
}

export interface BulkJob {
  id: string;
  type: "POD" | "Invoice";
  createdOn: string;
  totalFiles: number;
  matched: number;
  needsReview: number;
  skipped: number;
  status: "Processing" | "Completed" | "Failed";
  journeyIds: string[];
}

export const mockJourneys: Journey[] = [
  {
    id: "1",
    lcuNo: "LCU-2024-001",
    journeyNo: "JRN-001",
    lrNo: "LR-001-24",
    transporter: "Express Logistics",
    origin: "Mumbai",
    destination: "Delhi",
    baseCharges: 45000,
    addonCharges: 5000,
    totalAmount: 50000,
    status: "Pending",
    category: "ePOD Pending",
    pickupDate: "2024-01-15",
    deliveryDate: "2024-01-18",
    vehicleNumber: "MH02AB1234",
    vehicleType: "32ft Trailer",
    materialType: "Electronics",
    consigneeName: "Tech Distributors Pvt Ltd",
    paymentMode: "To-pay",
    contractType: "Rate Card",
    materials: [
      { id: "m1", item: "IT-001", description: "Electronics", quantity: 100, uom: "Boxes", weight: 500 },
      { id: "m2", item: "IT-002", description: "Components", quantity: 50, uom: "Boxes", weight: 250 },
    ],
    charges: [
      { id: "c1", type: "Base Freight", amount: 45000, source: "System", category: "Base", gstApplicable: true, gstPercent: 18, totalWithGST: 53100 },
      { id: "c2", type: "Fuel Surcharge", amount: 3000, source: "System", category: "Add-on", gstApplicable: true, gstPercent: 18, totalWithGST: 3540 },
      { id: "c3", type: "Loading Charges", amount: 2000, source: "System", category: "Add-on", gstApplicable: false },
    ],
  },
  {
    id: "2",
    lcuNo: "LCU-2024-002",
    journeyNo: "JRN-002",
    lrNo: "LR-002-24",
    transporter: "Swift Transport",
    origin: "Bangalore",
    destination: "Hyderabad",
    baseCharges: 32000,
    addonCharges: 3000,
    totalAmount: 35000,
    status: "Approved",
    category: "ePOD Approved",
    pickupDate: "2024-01-16",
    deliveryDate: "2024-01-17",
    vehicleNumber: "KA03CD5678",
    vehicleType: "20ft Container",
    materialType: "Furniture",
    consigneeName: "Home Decor Solutions",
    paymentMode: "Prepaid",
    contractType: "Spot",
    podDocuments: [
      { id: "pod1", filename: "POD_JRN002.pdf", uploadDate: "2024-01-17", uploadedBy: "John Doe", status: "Approved" },
    ],
    materials: [
      { id: "m3", item: "IT-003", description: "Furniture", quantity: 25, uom: "Pieces", weight: 1000 },
    ],
    charges: [
      { id: "c4", type: "Base Freight", amount: 32000, source: "System", category: "Base", gstApplicable: true, gstPercent: 18, totalWithGST: 37760 },
      { id: "c5", type: "Toll Charges", amount: 3000, source: "System", category: "Add-on", gstApplicable: false },
    ],
  },
  {
    id: "3",
    lcuNo: "LCU-2024-003",
    journeyNo: "JRN-003",
    lrNo: "LR-003-24",
    transporter: "Prime Movers",
    origin: "Chennai",
    destination: "Kolkata",
    baseCharges: 58000,
    addonCharges: 7000,
    totalAmount: 65000,
    status: "In Audit",
    category: "ePOD Approved",
    pickupDate: "2024-01-14",
    deliveryDate: "2024-01-17",
    vehicleNumber: "TN09EF9012",
    vehicleType: "40ft Container",
    materialType: "Machinery Parts",
    consigneeName: "Industrial Equipment Corp",
    paymentMode: "TBB",
    contractType: "Rate Card",
    podDocuments: [
      { id: "pod2", filename: "POD_JRN003.pdf", uploadDate: "2024-01-15", uploadedBy: "Jane Smith", status: "Approved" },
    ],
    materials: [
      { id: "m4", item: "IT-004", description: "Machinery Parts", quantity: 10, uom: "Units", weight: 2000 },
    ],
    charges: [
      { id: "c6", type: "Base Freight", amount: 58000, source: "System", category: "Base", gstApplicable: true, gstPercent: 18, totalWithGST: 68440 },
      { id: "c7", type: "Detention Charges", amount: 5000, source: "System", category: "Add-on", gstApplicable: true, gstPercent: 18, totalWithGST: 5900 },
      { id: "c8", type: "Special Handling", amount: 2000, source: "System", category: "Add-on", gstApplicable: false },
    ],
  },
  {
    id: "4",
    lcuNo: "LCU-2024-004",
    journeyNo: "JRN-004",
    lrNo: "LR-004-24",
    transporter: "Express Logistics",
    origin: "Pune",
    destination: "Ahmedabad",
    baseCharges: 28000,
    addonCharges: 2500,
    totalAmount: 30500,
    status: "Pending",
    category: "ePOD Pending",
    pickupDate: "2024-01-18",
    deliveryDate: "2024-01-20",
    vehicleNumber: "MH12GH3456",
    vehicleType: "24ft Truck",
    materialType: "Textiles",
    consigneeName: "Fashion Retail Hub",
    paymentMode: "To-pay",
    contractType: "Spot",
    materials: [
      { id: "m5", item: "IT-005", description: "Textiles", quantity: 200, uom: "Rolls", weight: 800 },
    ],
    charges: [
      { id: "c9", type: "Base Freight", amount: 28000, source: "System", category: "Base", gstApplicable: true, gstPercent: 18, totalWithGST: 33040 },
      { id: "c10", type: "Insurance", amount: 2500, source: "System", category: "Add-on", gstApplicable: false },
    ],
  },
  {
    id: "5",
    lcuNo: "LCU-2024-005",
    journeyNo: "JRN-005",
    lrNo: "LR-005-24",
    transporter: "Swift Transport",
    origin: "Jaipur",
    destination: "Lucknow",
    baseCharges: 35000,
    addonCharges: 4000,
    totalAmount: 39000,
    status: "Missing details",
    category: "Open Trips",
    pickupDate: "2024-01-20",
    vehicleNumber: "RJ14IJ7890",
    vehicleType: "14ft Tempo",
    materialType: "Consumer Goods",
    consigneeName: "Retail Chain Ltd",
    paymentMode: "Prepaid",
    contractType: "Rate Card",
    materials: [
      { id: "m6", item: "IT-006", description: "Consumer Goods", quantity: 150, uom: "Boxes", weight: 600 },
    ],
    charges: [
      { id: "c11", type: "Base Freight", amount: 35000, source: "System", category: "Base", gstApplicable: true, gstPercent: 18, totalWithGST: 41300 },
      { id: "c12", type: "Unloading Charges", amount: 4000, source: "System", category: "Add-on", gstApplicable: false },
    ],
  },
];

export const mockBulkJobs: BulkJob[] = [
  {
    id: "job1",
    type: "POD",
    createdOn: "2024-01-18 14:30",
    totalFiles: 10,
    matched: 7,
    needsReview: 2,
    skipped: 1,
    status: "Completed",
    journeyIds: ["1", "2", "3", "4", "5"],
  },
  {
    id: "job2",
    type: "Invoice",
    createdOn: "2024-01-17 10:15",
    totalFiles: 5,
    matched: 4,
    needsReview: 1,
    skipped: 0,
    status: "Completed",
    journeyIds: ["2", "3"],
  },
  {
    id: "job3",
    type: "POD",
    createdOn: "2024-01-19 16:45",
    totalFiles: 8,
    matched: 0,
    needsReview: 0,
    skipped: 0,
    status: "Processing",
    journeyIds: ["1", "4"],
  },
];
