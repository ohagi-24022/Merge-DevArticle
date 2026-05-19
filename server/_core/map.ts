/**
 * Google Maps server-side API helpers.
 * Set GOOGLE_MAPS_API_KEY in the environment.
 */

import { ENV } from "./env";

type MapsConfig = {
  apiKey: string;
};

function getMapsConfig(): MapsConfig {
  if (!ENV.googleMapsApiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  return { apiKey: ENV.googleMapsApiKey };
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}

export async function makeRequest<T = unknown>(
  endpoint: string,
  params: Record<string, unknown> = {},
  options: RequestOptions = {}
): Promise<T> {
  const { apiKey } = getMapsConfig();
  const url = new URL(`https://maps.googleapis.com${endpoint}`);
  url.searchParams.append("key", apiKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  return (await response.json()) as T;
}

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";
export type MapType = "roadmap" | "satellite" | "terrain" | "hybrid";
export type LatLng = { lat: number; lng: number };
