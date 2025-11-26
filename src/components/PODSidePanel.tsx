import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, X } from "lucide-react";

interface PODSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    loadId: string;
    vehicle: string;
    consignee: string;
    document: string;
    ocrVehicle: string;
    ocrLoadId: string;
    confidence: number;
  };
}

export function PODSidePanel({ open, onOpenChange, data }: PODSidePanelProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-success";
    if (confidence >= 70) return "text-warning";
    return "text-destructive";
  };

  const handleAttach = () => {
    console.log("Attaching document:", data.document);
    onOpenChange(false);
  };

  const handleReplace = () => {
    console.log("Opening file chooser to replace document");
  };

  const handleSkip = () => {
    console.log("Skipping load:", data.loadId);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-[500px] ml-auto">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle>Load Details</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription>Review and confirm document matching</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Load Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Load ID</label>
              <p className="text-lg font-semibold mt-1">{data.loadId}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Vehicle Number</label>
              <p className="text-lg font-semibold mt-1">{data.vehicle}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Consignee</label>
              <p className="text-lg font-semibold mt-1">{data.consignee}</p>
            </div>
          </div>

          {/* Document Preview */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Attached Document</h3>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{data.document}</p>
                <p className="text-xs text-muted-foreground">PDF Document</p>
              </div>
            </div>
          </div>

          {/* OCR Extracted Fields */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-medium mb-4">OCR Extracted Fields</h3>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Vehicle Number</label>
                  <p className="font-medium mt-1">{data.ocrVehicle}</p>
                </div>
                <Badge 
                  variant={data.vehicle === data.ocrVehicle ? "default" : "destructive"}
                  className="mt-1"
                >
                  {data.vehicle === data.ocrVehicle ? "Match" : "Mismatch"}
                </Badge>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Load ID</label>
                  <p className="font-medium mt-1">{data.ocrLoadId}</p>
                </div>
                <Badge 
                  variant={data.loadId === data.ocrLoadId ? "default" : "destructive"}
                  className="mt-1"
                >
                  {data.loadId === data.ocrLoadId ? "Match" : "Mismatch"}
                </Badge>
              </div>

              <div className="flex items-start justify-between pt-2 border-t">
                <label className="text-sm text-muted-foreground">Confidence Score</label>
                <span className={`text-lg font-bold ${getConfidenceColor(data.confidence)}`}>
                  {data.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t flex-row gap-3">
          <Button variant="outline" onClick={handleReplace} className="flex-1">
            Replace
          </Button>
          <Button onClick={handleAttach} className="flex-1">
            Attach
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Skip Load
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
