import { X, ChevronDown, FileText, Package, TruckIcon, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "./StatusPill";
import { Journey, ChargeWithGST } from "@/lib/mockData";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface JourneyDetailsDrawerProps {
  journey: Journey | null;
  onClose: () => void;
}

export function JourneyDetailsDrawer({ journey, onClose }: JourneyDetailsDrawerProps) {
  const [podOpen, setPodOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(true);
  const [uploadDocsOpen, setUploadDocsOpen] = useState(false);

  if (!journey) return null;

  const charges = journey.charges as ChargeWithGST[] | undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[640px] bg-background border-l shadow-lg z-50 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Journey Details</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{journey.lrNo}</span>
                <span>•</span>
                <span>{journey.lcuNo}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Route Card */}
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TruckIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{journey.transporter}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="font-medium">{journey.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{journey.destination}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pickup: {new Date(journey.pickupDate).toLocaleDateString("en-IN")}
                    {journey.deliveryDate && ` • Delivery: ${new Date(journey.deliveryDate).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LCU Details */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">LCU Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">LCU Number</p>
                  <p className="font-medium">{journey.lcuNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">LR Number</p>
                  <p className="font-medium">{journey.lrNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Origin</p>
                  <p className="font-medium">{journey.origin}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Destination</p>
                  <p className="font-medium">{journey.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Transporter</p>
                  <p className="font-medium">{journey.transporter}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Pickup Date</p>
                  <p className="font-medium">{new Date(journey.pickupDate).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charge Breakup */}
          <Collapsible open={chargesOpen} onOpenChange={setChargesOpen}>
            <Card className="border shadow-sm">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide">Charge Breakup</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${chargesOpen ? "rotate-180" : ""}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {charges && charges.length > 0 ? (
                    <div className="space-y-3">
                      {/* Base Section */}
                      <div className="space-y-2">
                        <div className="bg-muted/30 px-3 py-1.5 rounded-sm">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Base</p>
                        </div>
                        {charges
                          .filter(c => c.category === "Base")
                          .map((charge) => (
                            <div key={charge.id} className="flex items-center justify-between py-2 px-3 hover:bg-muted/20 rounded-sm">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{charge.type}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-sm font-semibold w-28 text-right">₹{charge.amount.toLocaleString("en-IN")}</p>
                                <Badge variant={charge.source === "System" ? "secondary" : "default"} className="text-xs w-20 justify-center">
                                  {charge.source}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Add-On Section */}
                      <div className="space-y-2">
                        <div className="bg-muted/30 px-3 py-1.5 rounded-sm">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add-On</p>
                        </div>
                        <div className="flex items-center justify-between px-3 py-1">
                          <p className="text-sm font-medium text-muted-foreground">Additional charges</p>
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary text-xs">
                            + Add additional charges
                          </Button>
                        </div>
                        {charges
                          .filter(c => c.category === "Add-on")
                          .map((charge) => (
                            <div key={charge.id} className="flex items-center justify-between py-2 px-3 hover:bg-muted/20 rounded-sm">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{charge.type}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-sm font-semibold w-28 text-right">₹{charge.amount.toLocaleString("en-IN")}</p>
                                <Badge variant={charge.source === "System" ? "secondary" : "default"} className="text-xs w-20 justify-center">
                                  {charge.source}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Penalty & Adjustments Section */}
                      <div className="space-y-2">
                        <div className="bg-muted/30 px-3 py-1.5 rounded-sm">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Penalty & Adjustments</p>
                        </div>
                        {charges
                          .filter(c => c.category === "Penalty")
                          .map((charge) => (
                            <div key={charge.id} className="flex items-center justify-between py-2 px-3 hover:bg-muted/20 rounded-sm">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{charge.type}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-sm font-semibold w-28 text-right">₹{charge.amount.toLocaleString("en-IN")}</p>
                                <Badge variant={charge.source === "System" ? "secondary" : "default"} className="text-xs w-20 justify-center">
                                  {charge.source}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No charges listed</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Invoice Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              {/* Charges Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Charges</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Freight Charges</span>
                    <span className="font-medium">₹{journey.baseCharges.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Additional Charges</span>
                    <span className="font-medium">₹{journey.addonCharges.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Deductions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Penalty Amount</span>
                    <span className="font-medium text-destructive">-₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Discount applied 0%</span>
                    <span className="font-medium text-destructive">-₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">SGST 6%</span>
                    <span className="font-medium">₹{((journey.baseCharges + journey.addonCharges) * 0.06).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">CGST 6%</span>
                    <span className="font-medium">₹{((journey.baseCharges + journey.addonCharges) * 0.06).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Total Payable Amount */}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Total Payable Amount</span>
                  <span className="text-2xl font-bold text-primary">₹{journey.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* POD Details - Only show for closed/disputed trips, not ongoing */}
          {journey.status !== "Ongoing" && (
          <Collapsible open={podOpen} onOpenChange={setPodOpen}>
            <Card className="border shadow-sm">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide">POD Details</CardTitle>
                      {/* ePOD Status Badge */}
                      <Badge 
                        variant={
                          journey.status === "Approved" ? "default" : 
                          journey.status === "Pending" ? "secondary" : 
                          "destructive"
                        }
                        className={
                          journey.status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                          journey.status === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                          journey.status === "In Audit" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                          journey.status === "Yet to raise" ? "bg-orange-100 text-orange-800 hover:bg-orange-100" :
                          "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {journey.status === "Approved" ? "Approved" :
                         journey.status === "Pending" ? "Pending" :
                         journey.status === "In Audit" ? "Review Pending" :
                         journey.status === "Yet to raise" ? "Re-Upload Supporting Doc" :
                         "Rejected"}
                      </Badge>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${podOpen ? "rotate-180" : ""}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {journey.podDocuments && journey.podDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {journey.podDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                          <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded by {doc.uploadedBy} on {doc.uploadDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No POD uploaded yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => document.getElementById('pod-upload-input')?.click()}
                        >
                        Upload POD
                      </Button>
                        <input
                          id="pod-upload-input"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              console.log('POD files selected:', files);
                              // TODO: Implement file upload logic
                            }
                          }}
                        />
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          )}

          {/* Upload Supporting Documents */}
          <Collapsible open={uploadDocsOpen} onOpenChange={setUploadDocsOpen}>
            <Card className="border shadow-sm">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide">Upload Supporting Documents</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${uploadDocsOpen ? "rotate-180" : ""}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div 
                    className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => document.getElementById('supporting-docs-input')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-primary');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary');
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        console.log('Supporting documents dropped:', files);
                        // TODO: Implement file upload logic
                      }
                    }}
                  >
                    <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground mb-3">Drag and drop files here or click to browse</p>
                    <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                      Choose Files
                    </Button>
                    <input
                      id="supporting-docs-input"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          console.log('Supporting documents selected:', files);
                          // TODO: Implement file upload logic
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Material Details */}
          <Collapsible open={materialsOpen} onOpenChange={setMaterialsOpen}>
            <Card className="border shadow-sm">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide">Material Details</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${materialsOpen ? "rotate-180" : ""}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {journey.materials && journey.materials.length > 0 ? (
                    <div className="space-y-2">
                      {journey.materials.map((material) => (
                        <div key={material.id} className="flex items-start gap-3 p-3 rounded-md border">
                          <Package className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-sm">{material.item}</p>
                              <span className="text-xs text-muted-foreground font-medium">{material.weight}kg</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{material.description}</p>
                            <p className="text-xs">
                              {material.quantity} {material.uom}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No materials listed</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </>
  );
}
