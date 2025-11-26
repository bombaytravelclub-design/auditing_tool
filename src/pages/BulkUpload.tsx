import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";

const BulkUpload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, journeyIds } = location.state || { type: "POD", journeyIds: [] };
  
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles([...files, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    
    navigate("/bulk-upload/processing", { 
      state: { type, journeyIds, files: files.length } 
    });
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back to Proformas
          </Button>
          <h1 className="text-3xl font-bold mt-4 mb-2">Bulk Upload {type}</h1>
          <p className="text-muted-foreground">
            Upload documents for {journeyIds.length} selected journey(s)
          </p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF, PNG, JPG files
              </p>
              <Button variant="outline" onClick={() => document.getElementById("file-input")?.click()}>
                Select Files
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Selected Files ({files.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50 relative"
                    >
                      <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0}>
            Upload & Process
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default BulkUpload;
