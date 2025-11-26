import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { StatusPill } from "./StatusPill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Journey } from "@/lib/mockData";

interface JourneyTableProps {
  journeys: Journey[];
  selectedJourneys: string[];
  onSelectionChange: (ids: string[]) => void;
  onJourneyClick: (journey: Journey) => void;
}

export function JourneyTable({
  journeys,
  selectedJourneys,
  onSelectionChange,
  onJourneyClick,
}: JourneyTableProps) {
  const isAllSelected = journeys.length > 0 && selectedJourneys.length === journeys.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(journeys.map((j) => j.id));
    }
  };

  const handleSelectJourney = (id: string) => {
    if (selectedJourneys.includes(id)) {
      onSelectionChange(selectedJourneys.filter((jid) => jid !== id));
    } else {
      onSelectionChange([...selectedJourneys, id]);
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">LCU No</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">LR No</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Transporter</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Base Charges</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Add-on Charges</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Total Amount</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">POD Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {journeys.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No journeys found
              </TableCell>
            </TableRow>
          ) : (
            journeys.map((journey) => (
              <TableRow key={journey.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedJourneys.includes(journey.id)}
                    onCheckedChange={() => handleSelectJourney(journey.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{journey.lcuNo}</TableCell>
                <TableCell className="font-medium">{journey.lrNo}</TableCell>
                <TableCell>{journey.transporter}</TableCell>
                <TableCell className="text-right">₹{journey.baseCharges.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right">₹{journey.addonCharges.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right font-semibold">₹{journey.totalAmount.toLocaleString("en-IN")}</TableCell>
                <TableCell>
                  <StatusPill status={journey.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onJourneyClick(journey)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
