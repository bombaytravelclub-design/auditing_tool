import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SummaryCard } from "@/components/SummaryCard";
import { JourneyTable } from "@/components/JourneyTable";
import { JourneyDetailsDrawer } from "@/components/JourneyDetailsDrawer";
import { Button } from "@/components/ui/button";
import { Journey } from "@/lib/mockData";
import { fetchProformas, transformProformaToJourney, calculateSummaryStats, ApiProforma } from "@/lib/api";
// Removed static journey import - using only real database data
import { Upload, Calendar, Filter, Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [selectedTransporter, setSelectedTransporter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "Closed" | "Disputed" | "Open Trips">("Closed");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("ePOD Approved");
  const [selectedJourneys, setSelectedJourneys] = useState<string[]>([]);
  const [detailsJourney, setDetailsJourney] = useState<Journey | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // State for API data
  const [proformas, setProformas] = useState<ApiProforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchProformas({ limit: 200 });
        setProformas(response.data);
        setError(null);
        toast.success(`Loaded ${response.total} proformas from database`);
      } catch (err) {
        console.error('Error loading proformas:', err);
        setError('Failed to load data');
        toast.error('Failed to load data from API');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Transform API data to Journey format
  const allJourneys = useMemo(() => {
    const apiJourneys = proformas
      .map(transformProformaToJourney)
      .filter((j): j is Journey => j !== null);
    
    // Return only real database journeys (removed static display journeys)
    return apiJourneys;
  }, [proformas]);

  // Get unique transporters
  const transporters = useMemo(() => {
    return Array.from(new Set(allJourneys.map((j) => j.transporter)));
  }, [allJourneys]);

  // Filter journeys based on selections
  const filteredJourneys = useMemo(() => {
    return allJourneys.filter((journey) => {
      const transporterMatch = selectedTransporter === "all" || journey.transporter === selectedTransporter;
      
      let categoryMatch = true;
      
      if (selectedCategory === "Closed") {
        // Closed tab: ePOD Approved or ePOD Pending
        categoryMatch = journey.category === selectedSubCategory;
      } else if (selectedCategory === "Disputed") {
        // First check if journey is disputed
        const isDisputed = journey.category === "Disputed";
        if (!isDisputed) return false;
        
        // Handle disputed sub-categories based on status
        if (selectedSubCategory === "Rejected") {
          categoryMatch = journey.status === "Missing details";
        } else if (selectedSubCategory === "Review Pending") {
          categoryMatch = journey.status === "In Audit";
        } else if (selectedSubCategory === "Re-Upload Supporting Doc") {
          categoryMatch = journey.status === "Yet to raise";
        } else {
          // Show all disputed if no sub-category selected
          categoryMatch = true;
        }
      } else if (selectedCategory === "Open Trips") {
        // Open trips category
        categoryMatch = journey.category === "Open Trips";
      }
      
      // Date range filter
      let dateMatch = true;
      if (dateRange && dateRange.from && dateRange.to) {
        const journeyDate = new Date(journey.pickupDate);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        dateMatch = journeyDate >= fromDate && journeyDate <= toDate;
      }
      
      return transporterMatch && categoryMatch && dateMatch;
    });
  }, [allJourneys, selectedTransporter, selectedCategory, selectedSubCategory, dateRange]);

  // Calculate summary stats from real data
  const summaryStats = useMemo(() => {
    const stats = calculateSummaryStats(proformas);
    return stats;
  }, [proformas]);

  const handleBulkUpload = (type: "POD" | "Invoice") => {
    if (selectedJourneys.length === 0) {
      toast.error("Please select at least one journey");
      return;
    }
    navigate("/bulk-upload", { state: { type, journeyIds: selectedJourneys } });
  };

  // Update sub-category when main category changes
  const handleCategoryChange = (category: "all" | "Closed" | "Disputed" | "Open Trips") => {
    setSelectedCategory(category);
    // Set appropriate default sub-category
    if (category === "Closed") {
      setSelectedSubCategory("ePOD Approved");
    } else if (category === "Disputed") {
      setSelectedSubCategory("Rejected");
    } else {
      setSelectedSubCategory("");
    }
    setSelectedJourneys([]);
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Proforma Audit</h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading data...' : `Manage and audit freight proformas (${proformas.length} total)`}
          </p>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading proformas from database...</span>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={selectedTransporter} onValueChange={setSelectedTransporter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Transporter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transporters</SelectItem>
              {transporters.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange ? (
                  <span>
                    {new Date(dateRange.from).toLocaleDateString("en-IN", { month: 'short', year: 'numeric' })} - {new Date(dateRange.to).toLocaleDateString("en-IN", { month: 'short', year: 'numeric' })}
                  </span>
                ) : (
                  "Month Range"
                )}
                {dateRange && (
                  <X 
                    className="h-3 w-3 ml-2 hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange(null);
                      toast.success("Date filter cleared");
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <input
                    type="month"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={dateRange?.from ? dateRange.from.substring(0, 7) : ''}
                    onChange={(e) => {
                      const newFrom = e.target.value + '-01';
                      setDateRange({
                        from: newFrom,
                        to: dateRange?.to || newFrom
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <input
                    type="month"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={dateRange?.to ? dateRange.to.substring(0, 7) : ''}
                    onChange={(e) => {
                      const newTo = e.target.value + '-01';
                      // Get last day of the month
                      const date = new Date(newTo);
                      date.setMonth(date.getMonth() + 1);
                      date.setDate(0);
                      const lastDay = date.toISOString().split('T')[0];
                      
                      setDateRange({
                        from: dateRange?.from || newTo,
                        to: lastDay
                      });
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (dateRange?.from && dateRange?.to) {
                        setIsDatePickerOpen(false);
                        toast.success("Date filter applied");
                      } else {
                        toast.error("Please select both from and to dates");
                      }
                    }}
                  >
                    Apply
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setDateRange(null);
                      setIsDatePickerOpen(false);
                      toast.success("Date filter cleared");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Closed"
            count={summaryStats.closed.count}
            amount={summaryStats.closed.amount}
            variant="success"
            onClick={() => handleCategoryChange("Closed")}
            isActive={selectedCategory === "Closed"}
          />
          <SummaryCard
            title="Disputed"
            count={summaryStats.disputed.count}
            amount={summaryStats.disputed.amount}
            variant="destructive"
            onClick={() => handleCategoryChange("Disputed")}
            isActive={selectedCategory === "Disputed"}
          />
          <SummaryCard
            title="On-going Trips"
            count={summaryStats.ongoing.count}
            amount={summaryStats.ongoing.amount}
            variant="primary"
            onClick={() => handleCategoryChange("Open Trips")}
            isActive={selectedCategory === "Open Trips"}
          />
        </div>

        {/* Sub-category filters - for Closed */}
        {selectedCategory === "Closed" && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedSubCategory === "ePOD Approved" ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setSelectedSubCategory("ePOD Approved")}
            >
              ePOD Approved
            </Badge>
            <Badge
              variant={selectedSubCategory === "ePOD Pending" ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setSelectedSubCategory("ePOD Pending")}
            >
              ePOD Pending
            </Badge>
          </div>
        )}

        {/* Sub-category filters - for Disputed */}
        {selectedCategory === "Disputed" && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedSubCategory === "Rejected" ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setSelectedSubCategory("Rejected")}
            >
              Rejected
            </Badge>
            <Badge
              variant={selectedSubCategory === "Review Pending" ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setSelectedSubCategory("Review Pending")}
            >
              Review Pending
            </Badge>
            <Badge
              variant={selectedSubCategory === "Re-Upload Supporting Doc" ? "default" : "outline"}
              className="cursor-pointer px-4 py-1.5 text-sm"
              onClick={() => setSelectedSubCategory("Re-Upload Supporting Doc")}
            >
              Re-Upload Supporting Doc
            </Badge>
          </div>
        )}

        {/* Bulk Actions */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {selectedJourneys.length > 0 && `${selectedJourneys.length} journey(s) selected`}
          </p>
          <div className="flex gap-2">
            {selectedCategory === "Closed" && selectedSubCategory === "ePOD Pending" && (
              <Button onClick={() => handleBulkUpload("POD")}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload POD
              </Button>
            )}
            {selectedCategory === "Closed" && selectedSubCategory === "ePOD Approved" && (
              <Button onClick={() => handleBulkUpload("Invoice")}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Journey Table */}
        <JourneyTable
          journeys={filteredJourneys}
          selectedJourneys={selectedJourneys}
          onSelectionChange={setSelectedJourneys}
          onJourneyClick={setDetailsJourney}
        />
        </>
        )}
      </div>

      {/* Journey Details Drawer */}
      <JourneyDetailsDrawer
        journey={detailsJourney}
        onClose={() => setDetailsJourney(null)}
      />
    </AppLayout>
  );
};

export default Index;
