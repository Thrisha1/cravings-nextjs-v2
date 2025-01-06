"use server";
import { extractLatLonFromGoogleMapsUrl, resolveShortUrl } from "./extractLatLonFromGoogleMapsUrl";

interface Coordinates {
  lat: number;
  lon: number;
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

  return earthRadiusKm * c;
}

export async function isHotelNear(
  hotelLocation: string,
  userLocation: Coordinates,
  distanceRange: number
): Promise<boolean> {

  const fullUrl = await resolveShortUrl(hotelLocation);
  const hotelCoordinates = await extractLatLonFromGoogleMapsUrl(fullUrl);

  if (!hotelCoordinates) {
    console.error(
      "Unable to extract coordinates from the provided URL.",
      hotelLocation
    );
    return false;
  }

  const distance = getDistanceBetweenPoints(hotelCoordinates, userLocation);
  return distance <= distanceRange;
}
