interface Coordinates {
  lat: number;
  lon: number;
}

export function extractLatLonFromGoogleMapsUrl(
  url: string
): Coordinates | null {
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;

  const match = url.match(regex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    return { lat, lon };
  }

  return {
    lat: 0,
    lon: 0,
  };
}

function getDistanceBetweenPoints(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371;

  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLon = toRadians(coord2.lon - coord1.lon);
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c * 1000; 
}

export function isHotelNear(
  hotelLocation: string,
  userLocation: Coordinates,
  // distanceRange: number = 10,
) {
  if (!userLocation.lat || !userLocation.lon) {
    return 0;
  }

  const hotelCoordinates =  extractLatLonFromGoogleMapsUrl(hotelLocation);

  if (!hotelCoordinates) {
    console.error(
      "Unable to extract coordinates from the provided URL.",
      hotelLocation
    );
    return 0;
  }

  const distance = getDistanceBetweenPoints(hotelCoordinates, userLocation);

  return distance;
}
