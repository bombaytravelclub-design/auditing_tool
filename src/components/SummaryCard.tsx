import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  count: number;
  amount: number;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function SummaryCard({ title, count, amount, variant = "default", className, onClick, isActive }: SummaryCardProps) {
  const getVariantStyles = () => {
    const base = isActive ? "ring-2 ring-offset-2" : "";
    switch (variant) {
      case "primary":
        return `border-primary/20 bg-primary/5 ${isActive ? "ring-primary" : ""}`;
      case "success":
        return `border-success/20 bg-success/5 ${isActive ? "ring-success" : ""}`;
      case "warning":
        return `border-warning/20 bg-warning/5 ${isActive ? "ring-warning" : ""}`;
      case "destructive":
        return `border-destructive/20 bg-destructive/5 ${isActive ? "ring-destructive" : ""}`;
      default:
        return `border-border bg-card ${isActive ? "ring-primary" : ""}`;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return "text-primary";
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "destructive":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card 
      className={cn(
        "shadow-sm hover:shadow-md transition-all border cursor-pointer", 
        getVariantStyles(), 
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className={cn("text-2xl font-bold", getTextColor())}>{count}</p>
            <p className="text-xs text-muted-foreground">trips</p>
          </div>
          <p className={cn("text-sm font-semibold", getTextColor())}>
            ₹{amount.toLocaleString("en-IN")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
