import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";

interface Charge {
  id: string;
  type: string;
  contracted: number;
  invoice: number;
  variance: number;
  status: "accepted" | "rejected" | "pending";
  rejectionReason?: string;
}

interface InvoiceAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    invoiceNo: string;
    status: "Overcharged" | "Undercharged" | "Matched";
    mode: string;
    serviceLevel: string;
    invoiceDate: string;
    contractedCost: number;
    invoiceAmount: number;
    variance: number;
    charges: Charge[];
    checks: {
      label: string;
      status: "Matched" | "Unmatched" | "Available" | "Missing";
    }[];
  };
}

export function InvoiceAuditModal({ open, onOpenChange, data }: InvoiceAuditModalProps) {
  // Ensure charges and checks are always arrays
  const safeData = {
    ...data,
    charges: Array.isArray(data?.charges) ? data.charges : [],
    checks: Array.isArray(data?.checks) ? data.checks : [],
  };
  const [charges, setCharges] = useState(safeData.charges);
  const [rejectingChargeId, setRejectingChargeId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAcceptCharge = (chargeId: string) => {
    setCharges((prevCharges) => (prevCharges || []).map(c => 
      c.id === chargeId ? { ...c, status: "accepted" as const } : c
    ));
  };

  const handleRejectCharge = (chargeId: string) => {
    setRejectingChargeId(chargeId);
  };

  const confirmReject = () => {
    if (rejectingChargeId) {
      setCharges((prevCharges) => (prevCharges || []).map(c => 
        c.id === rejectingChargeId 
          ? { ...c, status: "rejected" as const, rejectionReason } 
          : c
      ));
      setRejectingChargeId(null);
      setRejectionReason("");
    }
  };

  const cancelReject = () => {
    setRejectingChargeId(null);
    setRejectionReason("");
  };

  const handleSave = () => {
    console.log("Saving invoice audit:", charges);
    onOpenChange(false);
  };

  const getStatusVariant = (status: string) => {
    if (status === "Overcharged") return "destructive";
    if (status === "Undercharged") return "outline";
    return "default";
  };

  const getCheckStatusVariant = (status: string) => {
    if (status === "Matched" || status === "Available") return "default";
    if (status === "Unmatched" || status === "Missing") return "destructive";
    return "outline";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogDescription>Review and reconcile invoice charges</DialogDescription>
        </DialogHeader>

        {/* Top Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <label className="text-xs text-muted-foreground">Docket/Invoice No</label>
            <p className="font-semibold mt-1">{safeData.invoiceNo || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <div className="mt-1">
              <Badge variant={getStatusVariant(safeData.status || 'Matched')}>{safeData.status || 'Matched'}</Badge>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mode</label>
            <p className="font-semibold mt-1">{safeData.mode || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Service Level</label>
            <p className="font-semibold mt-1">{safeData.serviceLevel || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Invoice Date</label>
            <p className="font-semibold mt-1">{safeData.invoiceDate || 'N/A'}</p>
          </div>
        </div>

        {/* Checks Section */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Validation Checks</h3>
          <div className="grid grid-cols-2 gap-3">
            {(safeData.checks || []).map((check, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                <span className="text-sm">{check.label}</span>
                <Badge variant={getCheckStatusVariant(check.status)} className="text-xs">
                  {check.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <label className="text-xs text-muted-foreground">Contracted Cost</label>
            <p className="text-lg font-bold mt-1">
              {safeData.contractedCost !== null && safeData.contractedCost !== undefined
                ? `₹${safeData.contractedCost.toLocaleString("en-IN")}`
                : <span className="text-muted-foreground">No contract</span>}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Invoice Amount</label>
            <p className="text-lg font-bold mt-1">₹{(safeData.invoiceAmount || 0).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Variance</label>
            <p className={`text-lg font-bold mt-1 ${(safeData.variance || 0) !== 0 ? "text-destructive" : "text-success"}`}>
              {(safeData.variance || 0) > 0 ? "+" : ""}₹{(safeData.variance || 0).toLocaleString("en-IN")}
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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(charges || []).map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell className="font-medium">{charge.type}</TableCell>
                  <TableCell className="text-right">
                    {charge.contracted !== null && charge.contracted !== undefined
                      ? `₹${charge.contracted.toLocaleString("en-IN")}`
                      : <span className="text-muted-foreground">No contract</span>}
                  </TableCell>
                  <TableCell className="text-right">₹{charge.invoice.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right">
                    <span className={charge.variance !== 0 ? "text-destructive font-semibold" : ""}>
                      {charge.variance > 0 ? "+" : ""}₹{charge.variance.toLocaleString("en-IN")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.status === "accepted" ? (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    ) : charge.status === "rejected" ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    ) : rejectingChargeId === charge.id ? (
                      <div className="space-y-2 min-w-[200px]">
                        <Textarea
                          placeholder="Reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-xs"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={cancelReject}
                            className="flex-1 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={confirmReject}
                            className="flex-1 text-xs"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAcceptCharge(charge.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectCharge(charge.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
