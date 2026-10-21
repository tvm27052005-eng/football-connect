interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  displayName: string;
}

const requestHeaders = {
  Accept: 'application/json',
  'User-Agent': 'FootballConnect/1.0 (venue-address-validation)'
};

export async function geocodeAddress(
  address: string,
  district: string,
  city: string
): Promise<GeocodedAddress | null> {
  const queries = [
    `${address}, ${district}, ${city}, Việt Nam`,
    `${address}, ${city}, Việt Nam`,
    `${district}, ${city}, Việt Nam`
  ];

  let result: GeocodingResult | undefined;
  for (const queryText of queries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const query = encodeURIComponent(queryText);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&q=${query}`,
        { headers: requestHeaders, signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error('Dịch vụ bản đồ hiện không phản hồi. Vui lòng thử lại sau.');
      }

      const results = await response.json() as GeocodingResult[];
      result = results[0];
      if (result) break;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Dịch vụ bản đồ phản hồi quá lâu. Vui lòng thử lại sau.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!result) return null;

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    displayName: result.display_name
  };
}
