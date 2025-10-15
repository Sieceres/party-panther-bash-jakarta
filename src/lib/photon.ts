// Photon geocoding service (OpenStreetMap data)
// Free, no API key required

export interface PhotonFeature {
  type: string;
  geometry: {
    coordinates: [number, number]; // [lng, lat]
    type: string;
  };
  properties: {
    osm_id: number;
    osm_type: string;
    osm_key: string;
    osm_value: string;
    name: string;
    country?: string;
    city?: string;
    state?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
  };
}

export interface PhotonResponse {
  features: PhotonFeature[];
  type: string;
}

const EDGE_FUNCTION_URL = "https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/photon-proxy";

// Search for places using Photon API via Edge Function proxy
export const searchPlaces = async (query: string): Promise<PhotonFeature[]> => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    // Bias results toward Indonesia and Jakarta
    const params = new URLSearchParams({
      type: "search",
      q: query,
      limit: "10",
      lat: "-6.2088", // Jakarta latitude
      lon: "106.8456", // Jakarta longitude
      osm_tag: "!highway:footway,!highway:path,!highway:cycleway", // Exclude paths
    });

    const response = await fetch(`${EDGE_FUNCTION_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error("Geocoding search failed");
    }

    const data: PhotonResponse = await response.json();
    return data.features || [];
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
};

// Get current location using browser geolocation
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      }
    );
  });
};

// Reverse geocode coordinates to address via Edge Function proxy
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const params = new URLSearchParams({
      type: "reverse",
      lat: lat.toString(),
      lon: lng.toString(),
      limit: "1",
    });

    const response = await fetch(`${EDGE_FUNCTION_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data: PhotonResponse = await response.json();
    
    if (data.features && data.features.length > 0) {
      return formatAddress(data.features[0]);
    }
    
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

// Format Photon feature into readable address
export const formatAddress = (feature: PhotonFeature): string => {
  const props = feature.properties;
  const parts: string[] = [];

  if (props.name) parts.push(props.name);
  if (props.housenumber) parts.push(props.housenumber);
  if (props.street) parts.push(props.street);
  if (props.city) parts.push(props.city);
  if (props.state) parts.push(props.state);
  if (props.country) parts.push(props.country);

  return parts.join(", ") || "Unknown location";
};
