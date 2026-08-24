import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

interface PawLoaderProps {
  /** Diameter of the spinning ring in px */
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Three paw prints orbiting in a circle — Party Panther's loading indicator.
 */
export const PawLoader = ({ size = 48, className, label }: PawLoaderProps) => {
  const paws = [0, 1, 2];
  const radius = size / 2;
  const pawSize = Math.max(12, Math.round(size / 3.5));

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} role="status" aria-live="polite">
      <div
        className="relative animate-spin"
        style={{ width: size, height: size, animationDuration: "1.1s" }}
      >
        {paws.map((i) => (
          <PawPrint
            key={i}
            className="absolute text-primary"
            style={{
              width: pawSize,
              height: pawSize,
              top: "50%",
              left: "50%",
              opacity: 1 - i * 0.28,
              transform: `rotate(${i * 120}deg) translate(0, -${radius}px) rotate(${i * 120}deg)`,
              transformOrigin: "center",
              marginLeft: -pawSize / 2,
              marginTop: -pawSize / 2,
            }}
          />
        ))}
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
};

export default PawLoader;
