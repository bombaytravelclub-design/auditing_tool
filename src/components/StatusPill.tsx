import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  variant?: "default" | "outline";
}

export function StatusPill({ status, variant = "default" }: StatusPillProps) {
  const getStatusStyles = () => {
    const normalized = status.toLowerCase().replace(/\s+/g, "-");
    
    switch (normalized) {
      case "approved":
      case "settled":
      case "matched":
        return "bg-success/10 text-success border-success/20";
      case "pending":
      case "needs-review":
      case "yet-to-raise":
        return "bg-warning/10 text-warning border-warning/20";
      case "rejected":
      case "failed":
      case "missing-details":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "in-audit":
      case "processing":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  return (
    <Badge 
      variant={variant}
      className={cn(
        "font-medium px-2.5 py-0.5 text-xs",
        variant === "default" && getStatusStyles()
      )}
    >
      {status}
    </Badge>
  );
}
