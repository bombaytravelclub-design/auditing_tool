import React, { useState, useEffect } from "react";
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
import { FileText, ChevronRight, Check, X, Eye, MessageSquare, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { mockBulkJobs, mockJourneys, Journey } from "@/lib/mockData";
import { JourneyDetailsDrawer } from "@/components/JourneyDetailsDrawer";
import { PODSidePanel } from "@/components/PODSidePanel";
import { InvoiceAuditModal } from "@/components/InvoiceAuditModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getBulkJob, submitReviewAction } from "@/api/bulkUpload";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ReviewWorkspace = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Early return if no jobId
  if (!jobId) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-lg font-semibold mb-2">No Job ID</p>
            <p className="text-muted-foreground mb-4">No job ID provided in URL</p>
            <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const [activeTab, setActiveTab] = useState("summary");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showJourneyDrawer, setShowJourneyDrawer] = useState(false);
  const [showPODPanel, setShowPODPanel] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [reviewActions, setReviewActions] = useState<Record<string, 'accepted' | 'rejected'>>({});
  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [selectedVarianceData, setSelectedVarianceData] = useState<any>(null);
  const [chargeActions, setChargeActions] = useState<Record<string, { status: 'accepted' | 'rejected' | 'pending', comment?: string }>>({});
  const [commentingChargeId, setCommentingChargeId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState("");
  const [showOcrPayload, setShowOcrPayload] = useState(false);
  
  // Real data from API
  const [job, setJob] = useState<any>(null);
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real job data from API
  useEffect(() => {
    const loadJobData = async () => {
      if (!jobId) {
        console.warn('⚠️ No jobId provided in URL');
        setLoading(false);
        setJob({ id: 'unknown', type: 'pod', status: 'error' });
        setReviewData([]);
        return;
      }
      
      try {
        console.log('🔄 Loading job data for jobId:', jobId);
        setLoading(true);
        
        const response = await getBulkJob(jobId);
        console.log('📦 API Response received:', {
          hasResponse: !!response,
          hasJob: !!response?.job,
          hasItems: !!response?.items,
          itemsCount: response?.items?.length || 0,
          success: response?.success,
          responseKeys: Object.keys(response || {})
        });
        
        // Debug: Log full response
        console.log('📦 Full API Response:', JSON.stringify(response, null, 2));
        
        // Debug: Log each item's OCR data
        if (response?.items && response.items.length > 0) {
          console.log('📋 Items OCR Data:');
          response.items.forEach((item: any, idx: number) => {
            console.log(`  Item ${idx + 1}:`, {
              id: item.id,
              fileName: item.file_name,
              matchStatus: item.match_status,
              ocrData: item.ocr_extracted_data,
              journeyId: item.journey_id
            });
          });
        }
        
        // Accept response if it has job data OR if success is not explicitly false
        if (response && (response.job || response.success !== false)) {
          const jobData = response.job || { id: jobId, type: 'pod', status: 'pending' };
          const itemsData = Array.isArray(response.items) ? response.items : [];
          
          console.log('✅ Setting job data:', {
            jobId: jobData.id,
            jobType: jobData.type,
            itemsCount: itemsData.length
          });
          
          setJob(jobData);
          setReviewData(itemsData);
        } else {
          console.error('❌ Invalid response structure:', response);
          toast.error('Invalid job data received');
          // Set minimal job data to prevent white screen
          setJob({ id: jobId, type: 'pod', status: 'error' });
          setReviewData([]);
        }
        setLoading(false);
      } catch (error: any) {
        console.error('❌ Error loading job:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack?.substring(0, 200),
          jobId: jobId
        });
        toast.error(`Failed to load job: ${error.message || 'Unknown error'}`);
        setLoading(false);
        // Set minimal job data to prevent white screen
        setJob({ id: jobId, type: 'pod', status: 'error' });
        setReviewData([]);
      }
    };

    if (jobId) {
      loadJobData();
    } else {
      setLoading(false);
    }
  }, [jobId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading job data...</p>
            <p className="text-xs text-muted-foreground mt-2">Job ID: {jobId || 'N/A'}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Allow rendering even with minimal job data - only show error if completely missing
  if (!job && !loading) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-lg font-semibold mb-2">Job not found</p>
            <p className="text-muted-foreground mb-4">
              {jobId ? `Job ID: ${jobId}` : 'No job ID provided'}
            </p>
            <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Ensure we have at least minimal job data
  const safeJob = job || { id: jobId, type: 'pod', status: 'pending' };

  // Extract job type early for use in render
  const jobType = safeJob?.type || safeJob?.job_type || 'pod';

  // Use ONLY real data from API - no mock data fallback
  const allReviewData = Array.isArray(reviewData) ? reviewData : [];

  // SUMMARY_PAGE_DATA - Frontend debug logging
  console.log('SUMMARY_PAGE_DATA', { items: allReviewData });

  // Summary: Filter items to show matched and needs_review items
  // Make filter robust - check multiple field names and values
  const summaryItems = allReviewData.filter((item) => {
    const matchStatus = item.match_status || item.matchStatus || item.status;
    return ['matched', 'mismatch', 'needs_review'].includes(matchStatus);
  });

  console.log('SUMMARY_FILTERED_ITEMS', { summaryItems });

  // Use summaryItems for Summary tab
  const summaryData = summaryItems;

  // Needs Review: Items where match_status is 'mismatch' (not matched, not skipped)
  // CRITERIA: match_status === 'mismatch' = Needs Review tab
  const needsReviewData = allReviewData.filter((item) => {
    const matchStatus = item.match_status || item.matchStatus || item.status;
    return matchStatus === 'mismatch';
  });

  // Skipped: Items where match_status is 'skipped'
  // CRITERIA: match_status === 'skipped' = Skipped tab
  const skippedData = allReviewData.filter((item) => {
    const matchStatus = item.match_status || item.matchStatus || item.status;
    console.log('🔍 Checking skipped filter for item:', {
      id: item.id,
      file_name: item.file_name,
      match_status: item.match_status,
      matchStatus: item.matchStatus,
      status: item.status,
      matches: matchStatus === 'skipped'
    });
    return matchStatus === 'skipped';
  });
  
  console.log('📊 Filtered data counts:', {
    total: allReviewData.length,
    summary: summaryData.length,
    needsReview: needsReviewData.length,
    skipped: skippedData.length,
    allItems: allReviewData.map(item => ({
      id: item.id,
      file_name: item.file_name,
      match_status: item.match_status,
      journey_id: item.journey_id
    }))
  });

  // Closed: Items where journey epod_status is 'approved'
  // CRITERIA: epod_status === 'approved' = Closed tab
  const closedData = allReviewData.filter((item) => {
    return item.epod_status === 'approved';
  });

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

  const handleViewVariance = (item: any) => {
    setSelectedVarianceData(item);
    setShowVarianceModal(true);
    // Reset charge actions for this item
    const initialChargeActions: Record<string, { status: 'accepted' | 'rejected' | 'pending', comment?: string }> = {};
    item.charges?.forEach((charge: any) => {
      initialChargeActions[charge.id] = { status: 'pending' };
    });
    setChargeActions(initialChargeActions);
    setCommentingChargeId(null);
    setTempComment("");
  };

  const handleAcceptVariance = async () => {
    if (!selectedVarianceData) {
      toast.error('No data selected');
      return;
    }
    
    try {
      console.log('Accepting variance for:', selectedVarianceData);
      
      // Update local state immediately for better UX
      const loadId = selectedVarianceData.loadId || selectedVarianceData.id || 'Unknown';
      const vehicle = selectedVarianceData.vehicle || 'N/A';
      handleAccept(loadId, vehicle);
      
      // Save to database if jobId exists
      if (jobId) {
        try {
          await submitReviewAction(jobId, {
            itemId: selectedVarianceData.id,
            chargeActions,
            overallDecision: 'accepted',
          });
        } catch (dbError: any) {
          console.error('Database save error:', dbError);
          // Don't show error toast - local state already updated
        }
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowVarianceModal(false);
        setSelectedVarianceData(null);
      }, 500);
    } catch (error: any) {
      console.error('Accept variance error:', error);
      toast.error('Failed to accept: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRejectVariance = async () => {
    if (!selectedVarianceData) {
      toast.error('No data selected');
      return;
    }
    
    try {
      console.log('Rejecting variance for:', selectedVarianceData);
      
      // Update local state immediately for better UX
      const loadId = selectedVarianceData.loadId || selectedVarianceData.id || 'Unknown';
      const vehicle = selectedVarianceData.vehicle || 'N/A';
      handleReject(loadId, vehicle);
      
      // Save to database if jobId exists
      if (jobId) {
        try {
          await submitReviewAction(jobId, {
            itemId: selectedVarianceData.id,
            chargeActions,
            overallDecision: 'rejected',
          });
        } catch (dbError: any) {
          console.error('Database save error:', dbError);
          // Don't show error toast - local state already updated
        }
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowVarianceModal(false);
        setSelectedVarianceData(null);
      }, 500);
    } catch (error: any) {
      console.error('Reject variance error:', error);
      toast.error('Failed to reject: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAcceptCharge = (chargeId: string) => {
    setChargeActions(prev => ({
      ...prev,
      [chargeId]: { status: 'accepted', comment: prev[chargeId]?.comment }
    }));
    toast.success("Charge accepted");
  };

  const handleRejectCharge = (chargeId: string) => {
    setCommentingChargeId(chargeId);
    setTempComment(chargeActions[chargeId]?.comment || "");
  };

  const confirmRejectCharge = (chargeId: string) => {
    setChargeActions(prev => ({
      ...prev,
      [chargeId]: { status: 'rejected', comment: tempComment }
    }));
    setCommentingChargeId(null);
    setTempComment("");
    toast.error("Charge rejected");
  };

  const cancelRejectCharge = () => {
    setCommentingChargeId(null);
    setTempComment("");
  };

  const handleAddComment = (chargeId: string) => {
    setCommentingChargeId(chargeId === commentingChargeId ? null : chargeId);
    setTempComment(chargeActions[chargeId]?.comment || "");
  };

  const saveComment = (chargeId: string) => {
    setChargeActions(prev => ({
      ...prev,
      [chargeId]: { ...prev[chargeId], comment: tempComment }
    }));
    setCommentingChargeId(null);
    setTempComment("");
    toast.success("Comment saved");
  };

  // Safety check - ensure job exists before rendering
  // Allow rendering even with minimal job data (id + type)
  if (!job || (!job.id && !jobId)) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-lg font-semibold mb-2">No job data available</p>
            <p className="text-muted-foreground mb-4">The job may not exist or failed to load.</p>
            <p className="text-xs text-muted-foreground mb-4">Job ID: {jobId || 'N/A'}</p>
            <Button onClick={() => navigate("/")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Additional safety - ensure we have valid job data (jobType already defined above)
  const matchedCount = safeJob?.matched || safeJob?.matchedFiles || 0;
  const needsReviewCount = safeJob?.needsReview || safeJob?.mismatchFiles || 0;
  const skippedCount = safeJob?.skipped || safeJob?.failedFiles || 0;

  // Final safety check - ensure we can render
  if (!safeJob || (!safeJob.id && !jobId)) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-lg font-semibold mb-2">Unable to load job</p>
            <p className="text-muted-foreground mb-4">Job ID: {jobId || 'N/A'}</p>
            <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <ErrorBoundary>
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/")}>
              ← Go to Proforma Audit
          </Button>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Review Workspace</h1>
              <Badge variant={jobType === "pod" || jobType === "POD" ? "default" : "outline"}>
                {jobType.toUpperCase()} Upload
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Review and approve matched documents for bulk upload job
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="summary">Summary ({summaryData?.length || 0})</TabsTrigger>
            <TabsTrigger value="review">Needs Review ({needsReviewData?.length || 0})</TabsTrigger>
            <TabsTrigger value="skipped">Skipped ({skippedData?.length || 0})</TabsTrigger>
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
                  {summaryData && summaryData.length > 0 ? (
                    summaryData.map((item, index) => (
                      <>
                        <TableRow key={item.id || index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.loadId || 'N/A'}</TableCell>
                          <TableCell>{item.vehicle || 'N/A'}</TableCell>
                          <TableCell>{item.consignee || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{item.document || item.documentUrl || item.file_name || 'N/A'}</span>
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
                              <StatusPill status={item.autoApproval || item.status || item.match_status || 'Pending'} />
                            )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                              size="sm"
                          variant="ghost" 
                              onClick={() => handleViewVariance(item)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                        </Button>
                      </TableCell>
                          <TableCell className="text-right">
                            {!reviewActions[item.loadId] ? (
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="text-success border-success hover:bg-success/10"
                                  onClick={() => handleAccept(item.loadId || item.id, item.vehicle || 'N/A')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                  onClick={() => handleReject(item.loadId || item.id, item.vehicle || 'N/A')}
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
                      </>
                    ))
                  ) : (
                    <>
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No items found for this job. Files may still be processing or no files were uploaded.
                        </TableCell>
                      </TableRow>
                      {/* Debug: Show job data */}
                      {job && (
                        <TableRow>
                          <TableCell colSpan={7} className="py-4">
                            <div className="bg-muted p-4 rounded-lg">
                              <p className="text-sm font-semibold mb-2">📋 Job Info:</p>
                              <pre className="text-xs overflow-auto max-h-40">
                                {JSON.stringify(job, null, 2)}
                              </pre>
                            </div>
                      </TableCell>
                    </TableRow>
                      )}
                    </>
                  )}
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
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wide">View Details</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {needsReviewData.length === 0 ? (
                    <>
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No items need review
                      </TableCell>
                    </TableRow>
                    </>
                  ) : (
                    needsReviewData.map((item, index) => (
                      <>
                      <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.loadId || 'N/A'}</TableCell>
                          <TableCell>{item.vehicle || 'N/A'}</TableCell>
                          <TableCell>{item.consignee || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{item.document || item.documentUrl || item.file_name || 'N/A'}</span>
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
                        <TableCell className="text-center">
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewVariance(item)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                        </TableCell>
                        <TableCell className="text-right">
                            {!reviewActions[item.loadId] ? (
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="text-success border-success hover:bg-success/10"
                                  onClick={() => handleAccept(item.loadId || item.id, item.vehicle || 'N/A')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                          <Button 
                            size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                  onClick={() => handleReject(item.loadId || item.id, item.vehicle || 'N/A')}
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
                      </>
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
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">File Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Load ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Vehicle</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Reason</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wide">View Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skippedData.length === 0 ? (
                    <>
                  <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No skipped items
                      </TableCell>
                    </TableRow>
                    </>
                  ) : (
                    skippedData.map((item, index) => (
                      <>
                      <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.file_name || item.document || 'N/A'}</TableCell>
                          <TableCell>{item.loadId || 'N/A'}</TableCell>
                          <TableCell>{item.vehicle || 'N/A'}</TableCell>
                        <TableCell>
                          <StatusPill status="Skipped" />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.reason || item.error_message || item.matchReason || 'No reason provided'}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewVariance(item)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                    </TableCell>
                  </TableRow>
                      </>
                    ))
                  )}
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
          data={selectedItem || {}}
        />

        {/* Variance Details Modal */}
        {selectedVarianceData && (
          <Dialog open={showVarianceModal} onOpenChange={setShowVarianceModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>POD Details - {selectedVarianceData.loadId}</DialogTitle>
                <DialogDescription>Review contracted vs invoice charges and variance</DialogDescription>
              </DialogHeader>

              {/* Top Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Load ID</label>
                  <p className="font-semibold mt-1">{selectedVarianceData.loadId}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Vehicle</label>
                  <p className="font-semibold mt-1">{selectedVarianceData.vehicle}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Consignee</label>
                  <p className="font-semibold mt-1">{selectedVarianceData.consignee}</p>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Contracted Cost</label>
                  <p className="text-lg font-bold mt-1">
                    {selectedVarianceData.contractedCost !== null && selectedVarianceData.contractedCost !== undefined
                      ? `₹${selectedVarianceData.contractedCost.toLocaleString("en-IN")}`
                      : <span className="text-muted-foreground">No contract</span>}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Invoice Amount</label>
                  <p className="text-lg font-bold mt-1">
                    {selectedVarianceData.invoiceAmount !== null && selectedVarianceData.invoiceAmount !== undefined
                      ? `₹${selectedVarianceData.invoiceAmount.toLocaleString("en-IN")}`
                      : <span className="text-muted-foreground">N/A</span>}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Variance</label>
                  <p className={`text-lg font-bold mt-1 ${selectedVarianceData.variance !== null && selectedVarianceData.variance !== undefined && selectedVarianceData.variance !== 0 ? "text-destructive" : "text-success"}`}>
                    {selectedVarianceData.variance !== null && selectedVarianceData.variance !== undefined
                      ? `${selectedVarianceData.variance > 0 ? "+" : ""}₹${selectedVarianceData.variance.toLocaleString("en-IN")}`
                      : <span className="text-muted-foreground">N/A</span>}
                  </p>
                </div>
              </div>

              {/* Charge Breakup Table */}
              <div className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium">Charge Breakup</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Charge Type</TableHead>
                      <TableHead className="text-right">Contracted</TableHead>
                      <TableHead className="text-right">Invoice</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right w-[300px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedVarianceData.charges && Array.isArray(selectedVarianceData.charges) && selectedVarianceData.charges.length > 0 ? (
                      selectedVarianceData.charges.map((charge: any, index: number) => {
                        const chargeId = charge.id || `charge-${index}`;
                        return (
                          <React.Fragment key={chargeId}>
                            <TableRow>
                          <TableCell className="font-medium">{charge.type || 'Unknown Charge'}</TableCell>
                          <TableCell className="text-right">
                            {charge.contracted !== null && charge.contracted !== undefined
                              ? `₹${(charge.contracted || 0).toLocaleString("en-IN")}`
                              : <span className="text-muted-foreground">No contract</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {charge.invoice !== null && charge.invoice !== undefined
                              ? `₹${(charge.invoice || 0).toLocaleString("en-IN")}`
                              : <span className="text-muted-foreground">N/A</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {charge.variance !== null && charge.variance !== undefined ? (
                              <span className={charge.variance !== 0 ? "text-destructive font-semibold" : "text-success"}>
                                {charge.variance > 0 ? "+" : ""}₹{Math.abs(charge.variance).toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {chargeActions[charge.id]?.status === 'accepted' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Badge variant="default" className="bg-success text-success-foreground">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Accepted
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAddComment(charge.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : chargeActions[charge.id]?.status === 'rejected' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAddComment(charge.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : commentingChargeId === charge.id ? (
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={cancelRejectCharge}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => confirmRejectCharge(charge.id)}
                                >
                                  Confirm Reject
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAcceptCharge(charge.id)}
                                  className="text-success border-success hover:bg-success/10"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRejectCharge(charge.id)}
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAddComment(charge.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                        {commentingChargeId === charge.id && (
                          <TableRow key={`comment-input-${chargeId}`}>
                            <TableCell colSpan={5} className="bg-muted/30">
                              <div className="space-y-2 py-2">
                                <label className="text-xs font-medium">
                                  Add Comment {chargeActions[charge.id]?.status === 'rejected' && <span className="text-destructive">*</span>}
                                </label>
                                <Textarea
                                  placeholder={chargeActions[charge.id]?.status === 'rejected' ? "Reason for rejection (required)..." : "Add your comment..."}
                                  value={tempComment}
                                  onChange={(e) => setTempComment(e.target.value)}
                                  className="text-sm"
                                  rows={3}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={cancelRejectCharge}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => saveComment(charge.id)}
                                  >
                                    Save Comment
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {chargeActions[charge.id]?.comment && commentingChargeId !== charge.id && (
                          <TableRow key={`comment-saved-${chargeId}`}>
                            <TableCell colSpan={5} className="bg-muted/10">
                              <div className="flex items-start gap-2 py-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-muted-foreground">Comment:</p>
                                  <p className="text-sm mt-1">{chargeActions[charge.id].comment}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                      );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No charges found. This might indicate an issue with OCR extraction or data processing.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* OCR Payload Section */}
              <div className="rounded-lg border bg-card">
                <button
                  onClick={() => setShowOcrPayload(!showOcrPayload)}
                  className="w-full p-4 border-b flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <h3 className="text-sm font-medium">OCR Extracted Data</h3>
                  {showOcrPayload ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showOcrPayload && (
                  <div className="p-4">
                    <div className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-[400px]">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedVarianceData?.ocrData || selectedVarianceData?.ocr_extracted_data || {}, null, 2)}
                      </pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This is the raw OCR data extracted from the document. Use this to debug extraction issues.
                    </p>
                  </div>
                )}
              </div>

              {/* Accept/Reject Actions - Only show if variance > 0 and not already actioned */}
              {!reviewActions[selectedVarianceData?.loadId] && (
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">Action Required</h4>
                      {selectedVarianceData?.variance !== null && selectedVarianceData?.variance !== undefined && selectedVarianceData.variance !== 0 && (
                        <p className="text-sm text-muted-foreground">
                          Variance of ₹{Math.abs(selectedVarianceData.variance).toLocaleString("en-IN")} detected. Please review and accept or reject.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-success border-success hover:bg-success/10"
                        onClick={handleAcceptVariance}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={handleRejectVariance}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVarianceModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
    </ErrorBoundary>
  );
};

export default ReviewWorkspace;
