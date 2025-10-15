const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
  text: string;
}

export interface MapboxResponse {
  features: MapboxFeature[];
}

export const searchPlaces = async (query: string): Promise<MapboxFeature[]> => {
  if (!query.trim()) return [];
  
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not found. Please add VITE_MAPBOX_TOKEN to your environment.');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${MAPBOX_TOKEN}&` +
      `country=ID&` + // Limit to Indonesia
      `proximity=106.8456,-6.2088&` + // Bias to Jakarta center
      `limit=5&` +
      `language=en` // Get results in English
    );

    if (!response.ok) {
      throw new Error('Failed to fetch places');
    }

    const data: MapboxResponse = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
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
        reject(error);
      }
    );
  });
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  if (!MAPBOX_TOKEN) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
      `access_token=${MAPBOX_TOKEN}&` +
      `language=en`
    );

    if (!response.ok) {
      throw new Error('Failed to reverse geocode');
    }

    const data: MapboxResponse = await response.json();
    return data.features[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};
