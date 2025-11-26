import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { uploadBulkDocuments } from "@/api/bulkUpload";
import { toast } from "sonner";

const BulkUploadProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, journeyIds, files, fileCount } = location.state || { type: "POD", journeyIds: [], files: [], fileCount: 0 };
  
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [matched, setMatched] = useState(0);
  const [needsReview, setNeedsReview] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    "Uploading documents",
    "Running OCR extraction",
    "Matching with journey data",
    "Validating information",
    "Finalizing results",
  ];

  useEffect(() => {
    // Real upload and processing
    const processUpload = async () => {
      try {
        setCurrentStep(0); // Uploading documents
        setProgress(10);

        // Call real API
        const response = await uploadBulkDocuments({
          type,
          journeyIds,
          files: Array.isArray(files) ? files : [],
        });

        setProgress(40);
        setCurrentStep(1); // OCR extraction

        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(60);
        setCurrentStep(2); // Matching

        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(80);
        setCurrentStep(3); // Validating

        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress(95);
        setCurrentStep(4); // Finalizing

        // Update results
        setJobId(response.jobId);
        setMatched(response.summary.matched);
        setNeedsReview(response.summary.needsReview);
        
        setProgress(100);
        
        toast.success(`Processed ${response.summary.totalFiles} files successfully!`);

      } catch (error: any) {
        console.error('Upload processing error:', error);
        setError(error.message || 'Failed to process files');
        toast.error('Failed to process files: ' + error.message);
        setProgress(100); // Show completion even on error
        setCurrentStep(steps.length - 1);
      }
    };

    if (Array.isArray(files) && files.length > 0) {
      processUpload();
    }
  }, []);

  const isComplete = progress === 100 && currentStep === steps.length - 1;

  // Auto-navigate after completion
  useEffect(() => {
    if (isComplete && jobId && !error) {
      const timer = setTimeout(() => {
        navigate(`/bulk-jobs/${jobId}`);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isComplete, jobId, error, navigate]);

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto p-6">
        <Card className="shadow-card-hover">
          <CardContent className="p-12 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Processing Documents</h2>
              <p className="text-muted-foreground">
                Extracting information using OCR and matching with selected journeys
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold">{fileCount || (Array.isArray(files) ? files.length : 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Files</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/10">
                <p className="text-3xl font-bold text-success">{matched}</p>
                <p className="text-sm text-muted-foreground mt-1">Matched</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning/10">
                <p className="text-3xl font-bold text-warning">{needsReview}</p>
                <p className="text-sm text-muted-foreground mt-1">Needs Review</p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isStepComplete = index < currentStep || (isComplete && index === currentStep);
                const isStepInProgress = index === currentStep && !isComplete;
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        isStepComplete
                          ? "border-success bg-success text-success-foreground"
                          : isStepInProgress
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}
                    >
                      {isStepComplete ? (
                        <Check className="h-4 w-4" />
                      ) : isStepInProgress ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        index <= currentStep ? "font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action */}
            {isComplete && (
              <div className="pt-4">
                {error ? (
                  <div className="text-center">
                    <p className="text-destructive text-sm mb-3">{error}</p>
                    <Button 
                      variant="outline"
                      className="w-full" 
                      onClick={() => navigate("/")}
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                ) : jobId ? (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/bulk-jobs/${jobId}`)}
                  >
                    Go to Review Workspace
                  </Button>
                ) : (
                  <p className="text-center text-muted-foreground">Processing complete</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default BulkUploadProcessing;
