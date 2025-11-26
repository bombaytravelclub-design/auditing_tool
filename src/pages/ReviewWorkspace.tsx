import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, ChevronRight, Check, X } from "lucide-react";
import { mockBulkJobs, mockJourneys, Journey } from "@/lib/mockData";
import { JourneyDetailsDrawer } from "@/components/JourneyDetailsDrawer";
import { PODSidePanel } from "@/components/PODSidePanel";
import { InvoiceAuditModal } from "@/components/InvoiceAuditModal";
import { toast } from "sonner";

const ReviewWorkspace = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = mockBulkJobs.find((j) => j.id === jobId);

  const [activeTab, setActiveTab] = useState("summary");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showJourneyDrawer, setShowJourneyDrawer] = useState(false);
  const [showPODPanel, setShowPODPanel] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [reviewActions, setReviewActions] = useState<Record<string, 'accepted' | 'rejected'>>({});

  if (!job) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-6">
          <p>Job not found</p>
        </div>
      </AppLayout>
    );
  }

  // Mock data for demonstration
  const mockReviewData = [
    {
      loadId: "LCU-2024-001",
      vehicle: "MH02AB1234",
      consignee: "ABC Corp",
      document: "POD_001.pdf",
      matchType: "OCR",
      confidence: 95,
      autoApproval: "Passed",
      ocrVehicle: "MH02AB1234",
      ocrLoadId: "LCU-2024-001",
    },
    {
      loadId: "LCU-2024-002",
      vehicle: "KA03CD5678",
      consignee: "XYZ Ltd",
      document: "POD_002.pdf",
      matchType: "Filename",
      confidence: 88,
      autoApproval: "Passed",
      ocrVehicle: "KA03CD5678",
      ocrLoadId: "LCU-2024-002",
    },
    {
      loadId: "LCU-2024-003",
      vehicle: "TN09EF9012",
      consignee: "PQR Industries",
      document: "POD_003.pdf",
      matchType: "OCR",
      confidence: 62,
      autoApproval: "Failed",
      ocrVehicle: "TN09EF9013",
      ocrLoadId: "LCU-2024-003",
    },
  ];

  // Mock invoice data for Invoice jobs
  const mockInvoiceData = {
    invoiceNo: "INV-2024-001",
    status: "Overcharged" as const,
    mode: "Road",
    serviceLevel: "Express",
    invoiceDate: "2024-01-20",
    contractedCost: 50000,
    invoiceAmount: 55000,
    variance: 5000,
    charges: [
      { id: "1", type: "Base Freight", contracted: 45000, invoice: 45000, variance: 0, status: "pending" as const },
      { id: "2", type: "Fuel Surcharge", contracted: 3000, invoice: 5000, variance: 2000, status: "pending" as const },
      { id: "3", type: "Loading Charges", contracted: 2000, invoice: 5000, variance: 3000, status: "pending" as const },
    ],
    checks: [
      { label: "Origin-Destination", status: "Matched" as const },
      { label: "Mode", status: "Matched" as const },
      { label: "Weight", status: "Matched" as const },
      { label: "POD", status: "Available" as const },
    ],
  };

  const needsReviewData = mockReviewData.filter((d) => d.autoApproval === "Failed");
  const skippedData: any[] = [];

  const handleActionClick = (item: any) => {
    setSelectedItem(item);
    // Find the corresponding journey from mockJourneys by loadId (LCU number)
    const journey = mockJourneys.find(j => j.lcuNo === item.loadId);
    if (journey) {
      setSelectedJourney(journey);
      setShowJourneyDrawer(true);
    }
  };

  const handleAccept = (loadId: string, vehicle: string) => {
    setReviewActions(prev => ({ ...prev, [loadId]: 'accepted' }));
    toast.success(`✓ Accepted: ${loadId}`, {
      description: `POD for ${vehicle} has been approved`
    });
  };

  const handleReject = (loadId: string, vehicle: string) => {
    setReviewActions(prev => ({ ...prev, [loadId]: 'rejected' }));
    toast.error(`✗ Rejected: ${loadId}`, {
      description: `POD for ${vehicle} has been rejected`
    });
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate("/bulk-jobs")}>
            ← Back to Bulk Jobs
          </Button>
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Review Workspace</h1>
              <Badge variant={job.type === "POD" ? "default" : "outline"}>{job.type} Bulk</Badge>
            </div>
            <p className="text-muted-foreground">
              Review and approve matched documents for bulk upload job
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="summary">Summary ({job.matched})</TabsTrigger>
            <TabsTrigger value="review">Needs Review ({job.needsReview})</TabsTrigger>
            <TabsTrigger value="skipped">Skipped Loads ({job.skipped})</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Load ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Vehicle</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Consignee</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Attached Document</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReviewData.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.loadId}</TableCell>
                      <TableCell>{item.vehicle}</TableCell>
                      <TableCell>{item.consignee}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.document}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {reviewActions[item.loadId] ? (
                          <Badge 
                            variant={reviewActions[item.loadId] === 'accepted' ? 'default' : 'destructive'}
                            className={reviewActions[item.loadId] === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {reviewActions[item.loadId] === 'accepted' ? 'Accepted' : 'Rejected'}
                          </Badge>
                        ) : (
                          <StatusPill status={item.autoApproval} />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!reviewActions[item.loadId] ? (
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-success border-success hover:bg-success/10"
                              onClick={() => handleAccept(item.loadId, item.vehicle)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(item.loadId, item.vehicle)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {reviewActions[item.loadId] === 'accepted' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="review" className="mt-6">
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Load ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Vehicle</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Consignee</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Attached Document</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {needsReviewData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No items need review
                      </TableCell>
                    </TableRow>
                  ) : (
                    needsReviewData.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.loadId}</TableCell>
                        <TableCell>{item.vehicle}</TableCell>
                        <TableCell>{item.consignee}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.document}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reviewActions[item.loadId] ? (
                            <Badge 
                              variant={reviewActions[item.loadId] === 'accepted' ? 'default' : 'destructive'}
                              className={reviewActions[item.loadId] === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {reviewActions[item.loadId] === 'accepted' ? 'Accepted' : 'Rejected'}
                            </Badge>
                          ) : (
                            <StatusPill status="Needs Review" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!reviewActions[item.loadId] ? (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm"
                                variant="outline"
                                className="text-success border-success hover:bg-success/10"
                                onClick={() => handleAccept(item.loadId, item.vehicle)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive hover:bg-destructive/10"
                                onClick={() => handleReject(item.loadId, item.vehicle)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {reviewActions[item.loadId] === 'accepted' ? '✓ Approved' : '✗ Rejected'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="skipped" className="mt-6">
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Document Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Reason</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No skipped loads
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Journey Details Drawer */}
        <JourneyDetailsDrawer
          journey={selectedJourney}
          onClose={() => {
            setShowJourneyDrawer(false);
            setSelectedJourney(null);
          }}
        />

        {/* POD Side Panel - for specific POD actions */}
        {selectedItem && (
          <PODSidePanel
            open={showPODPanel}
            onOpenChange={setShowPODPanel}
            data={selectedItem}
          />
        )}

        {/* Invoice Audit Modal - for invoice reconciliation */}
        <InvoiceAuditModal
          open={showInvoiceModal}
          onOpenChange={setShowInvoiceModal}
          data={mockInvoiceData}
        />
      </div>
    </AppLayout>
  );
};

export default ReviewWorkspace;
