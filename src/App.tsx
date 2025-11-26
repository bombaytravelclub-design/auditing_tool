import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BulkJobs from "./pages/BulkJobs";
import BulkUpload from "./pages/BulkUpload";
import BulkUploadProcessing from "./pages/BulkUploadProcessing";
import ReviewWorkspace from "./pages/ReviewWorkspace";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bulk-jobs" element={<BulkJobs />} />
          <Route path="/bulk-jobs/:jobId" element={<ReviewWorkspace />} />
          <Route path="/bulk-upload" element={<BulkUpload />} />
          <Route path="/bulk-upload/processing" element={<BulkUploadProcessing />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
