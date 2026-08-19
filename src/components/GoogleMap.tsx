/// <reference types="google.maps" />
import { useEffect, useRef, useState, useMemo } from "react";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { supabase } from "@/integrations/supabase/client";

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  height?: string;
}

const ENV_MAPS_KEY =
  import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_CHANNEL = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

// The Lovable-managed connector key is only valid on *.lovable.app.
// On any other host (e.g. partypanther.net) fetch the project's own key.
const isLovableHost = /(^|\.)lovable\.(app|dev)$/.test(window.location.hostname) ||
  window.location.hostname === "localhost";

let cachedKeyPromise: Promise<string> | null = null;
const resolveMapsKey = (): Promise<string> => {
  if (isLovableHost && ENV_MAPS_KEY) return Promise.resolve(ENV_MAPS_KEY);
  if (!cachedKeyPromise) {
    cachedKeyPromise = supabase.functions
      .invoke("maps-key")
      .then(({ data, error }) => {
        if (error) throw error;
        return (data as { key?: string })?.key || ENV_MAPS_KEY || "";
      })
      .catch((e) => {
        console.error("Failed to load Google Maps key:", e);
        return ENV_MAPS_KEY || "";
      });
  }
  return cachedKeyPromise;
};

export const GoogleMap = ({ 
  center: propCenter,
  zoom = 13,
  onLocationSelect,
  markers = [],
  height = "400px"
}: GoogleMapProps) => {
  const defaultCenter = useMemo(() => ({ lat: -6.2088, lng: 106.8456 }), []);
  const center = propCenter || defaultCenter;
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [keyMissing, setKeyMissing] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    let cancelled = false;

    resolveMapsKey().then((key) => {
      if (cancelled) return;
      if (!key) {
        setKeyMissing(true);
        console.error("Google Maps API key is not configured.");
        return;
      }
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }
      const existing = document.getElementById("google-maps-script") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => setIsLoaded(true));
        return;
      }
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places${
        !isLovableHost || !GOOGLE_MAPS_CHANNEL ? "" : `&channel=${GOOGLE_MAPS_CHANNEL}`
      }`;
      script.async = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => console.error("Google Maps script failed to load.");
      document.head.appendChild(script);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize map instance
  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          { featureType: "all", stylers: [{ saturation: -20 }] }
        ],
        mapTypeControl: false,
        streetViewControl: false,
      });
      setMap(mapInstance);
    }
  }, [isLoaded, map, center, zoom]);

  // Update map center when prop changes
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);
  
  // Update map zoom when prop changes
  useEffect(() => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  // Handle location selection
  useEffect(() => {
    if (!map || !onLocationSelect) return;

    const geocoder = new google.maps.Geocoder();
    const listener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          const address = (status === "OK" && results?.[0])
            ? results[0].formatted_address
            : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onLocationSelect({ lat, lng, address });
        });
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onLocationSelect]);

  // Update markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerInfo => {
      const marker = new google.maps.Marker({
        position: { lat: markerInfo.lat, lng: markerInfo.lng },
        map,
        title: markerInfo.title,
      });
      markersRef.current.push(marker);
    });
  }, [map, markers]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div 
        className="bg-muted rounded-lg flex items-center justify-center border border-destructive/20"
        style={{ height }}
      >
        <div className="text-destructive text-center p-4">
          <p className="font-medium">Google Maps API key not configured</p>
          <p className="text-sm">Please set VITE_GOOGLE_MAPS_API_KEY environment variable</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className="bg-muted rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="flex items-center justify-center space-x-2">
          <SpinningPaws size="sm" />
          <span className="text-muted-foreground">Loading map...</span>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height }} className="w-full rounded-lg" />;
};