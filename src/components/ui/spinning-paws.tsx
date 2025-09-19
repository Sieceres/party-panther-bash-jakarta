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
        {/* Main paw in center */}
        <div className="absolute inset-0 animate-spin">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-neon-pink opacity-80 flex items-center justify-center">
            <div className="text-white font-bold text-xs">🐾</div>
          </div>
        </div>
        
        {/* Orbiting smaller paws */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
          <div className="relative w-full h-full">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-neon-cyan opacity-60 flex items-center justify-center">
              <span className="text-[8px]">🐾</span>
            </div>
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 rounded-full bg-neon-indigo opacity-60 flex items-center justify-center">
              <span className="text-[8px]">🐾</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-neon-green opacity-60 flex items-center justify-center">
              <span className="text-[8px]">🐾</span>
            </div>
            <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 rounded-full bg-neon-pink opacity-60 flex items-center justify-center">
              <span className="text-[8px]">🐾</span>
            </div>
          </div>
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