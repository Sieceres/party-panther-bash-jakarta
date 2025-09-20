import { cn } from "@/lib/utils";

interface SpinningPawsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const SpinningPaws = ({ className, size = "md" }: SpinningPawsProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Main paw in center, spinning */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin">
          <span className="text-3xl">🐾</span>
        </div>
      </div>
      <div className="ml-3 text-center">
        <div className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading...
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Fetching the hottest spots! 🎉
        </div>
      </div>
    </div>
  );
};