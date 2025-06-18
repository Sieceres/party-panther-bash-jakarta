import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { GoogleMap } from "../GoogleMap";

interface LocationSelectorProps {
  location: { lat: number; lng: number; address: string } | null;
  onLocationSelect: (location: { lat: number; lng: number; address: string } | null) => void;
  label?: string;
}

export const LocationSelector = ({ location, onLocationSelect, label = "Location (Optional)" }: LocationSelectorProps) => {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {showMap ? "Hide Map" : "Select Location"}
        </Button>
      </div>
      {location && (
        <p className="text-sm text-muted-foreground">
          Selected: {location.address}
        </p>
      )}
      {showMap && (
        <GoogleMap
          onLocationSelect={onLocationSelect}
          height="300px"
        />
      )}
    </div>
  );
};