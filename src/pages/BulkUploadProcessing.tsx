import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";

const BulkUploadProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, journeyIds, files } = location.state || { type: "POD", journeyIds: [], files: 0 };
  
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [matched, setMatched] = useState(0);
  const [needsReview, setNeedsReview] = useState(0);

  const steps = [
    "Uploading documents",
    "Running OCR extraction",
    "Matching with journey data",
    "Validating information",
    "Finalizing results",
  ];

  useEffect(() => {
    // Simulate processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    // Update steps based on progress
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    // Simulate results
    setTimeout(() => {
      setMatched(Math.floor(files * 0.7));
      setNeedsReview(Math.floor(files * 0.3));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [files]);

  const isComplete = progress === 100 && currentStep === steps.length - 1;

  // Auto-navigate after completion
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        navigate("/bulk-jobs/job1");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isComplete, navigate]);

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
                <p className="text-3xl font-bold">{files}</p>
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
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      index < currentStep
                        ? "border-success bg-success text-success-foreground"
                        : index === currentStep
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : index === currentStep ? (
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
              ))}
            </div>

            {/* Action */}
            {isComplete && (
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/bulk-jobs/job1")}
                >
                  Go to Review Workspace
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default BulkUploadProcessing;
