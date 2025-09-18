import { cn } from "@/lib/utils";

interface SpinningPawsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const SpinningPaws = ({ className, size = "md" }: SpinningPawsProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
      
      <div className="text-sm font-medium text-muted-foreground">
        Loading...
      </div>
    </div>
  );
};