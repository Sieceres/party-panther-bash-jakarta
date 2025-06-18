import { useEffect, useRef, useState } from "react";

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  height?: string;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyC8VSPvDyRnEQ06vbuhpdJrB9HB_j8GQa0";

export const GoogleMap = ({ 
  center = { lat: -6.2088, lng: 106.8456 }, // Jakarta center
  zoom = 13,
  onLocationSelect,
  markers = [],
  height = "400px"
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: "all",
          stylers: [{ saturation: -20 }]
        }
      ]
    });

    setMap(mapInstance);

    if (onLocationSelect) {
      const geocoder = new google.maps.Geocoder();
      
      mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              onLocationSelect({
                lat,
                lng,
                address: results[0].formatted_address
              });
            } else {
              onLocationSelect({
                lat,
                lng,
                address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
              });
            }
          });
        }
      });
    }
  }, [isLoaded, center, zoom, onLocationSelect]);

  useEffect(() => {
    if (!map || !markers.length) return;

    // Clear existing markers
    const newMarkers = markers.map(marker => 
      new google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map,
        title: marker.title
      })
    );

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, markers]);

  if (!isLoaded) {
    return (
      <div 
        className="bg-muted rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height }} className="w-full rounded-lg" />;
};