import { AppLayout } from "@/components/AppLayout";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockBulkJobs } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BulkJobs = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Bulk Jobs</h1>
          <p className="text-muted-foreground">View and manage bulk upload jobs</p>
        </div>

        {/* Jobs Table */}
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead className="text-center">Total Files</TableHead>
                <TableHead className="text-center">Matched</TableHead>
                <TableHead className="text-center">Needs Review</TableHead>
                <TableHead className="text-center">Skipped</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBulkJobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{job.id}</TableCell>
                  <TableCell>
                    <Badge variant={job.type === "POD" ? "default" : "outline"}>
                      {job.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.createdOn}</TableCell>
                  <TableCell className="text-center">{job.totalFiles}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-success font-medium">{job.matched}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-warning font-medium">{job.needsReview}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-muted-foreground">{job.skipped}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={job.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bulk-jobs/${job.id}`)}
                      disabled={job.status === "Processing"}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Workspace
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
};

export default BulkJobs;
