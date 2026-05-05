import { env } from "./env";

const MARINESIA_BASE = "https://api.marinesia.com/api/v1";

// In-memory cache for vessel data (free tier = 1 req/hour)
let cachedVessels: Array<{
  mmsi: number;
  name: string;
  lat: number;
  lng: number;
  cog: number;
  sog: number;
  hdt: number;
  status: number;
  ship_type?: string;
  dest?: string;
  eta?: string;
  timestamp: string;
}> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 3600000; // 1 hour

// Key shipping regions to scan for vessels
const SCAN_REGIONS = [
  { name: "Suez Canal", lat_min: 29.5, lat_max: 31.5, long_min: 31.5, long_max: 33.5 },
  { name: "Strait of Malacca", lat_min: 1.0, lat_max: 3.0, long_min: 102.5, long_max: 104.5 },
  { name: "Panama Canal", lat_min: 8.5, lat_max: 10.5, long_min: -80.5, long_max: -78.5 },
  { name: "English Channel", lat_min: 49.5, lat_max: 51.5, long_min: -1.0, long_max: 1.5 },
  { name: "Singapore", lat_min: 1.0, lat_max: 1.5, long_min: 103.7, long_max: 104.3 },
  { name: "Persian Gulf", lat_min: 24.5, lat_max: 26.5, long_min: 54.0, long_max: 56.0 },
  { name: "Gibraltar", lat_min: 35.8, lat_max: 36.2, long_min: -5.5, long_max: -5.0 },
  { name: "Bosporus", lat_min: 40.8, lat_max: 41.4, long_min: 28.9, long_max: 29.3 },
];

// Ship type classification from Marinesia status codes
const SHIP_TYPE_MAP: Record<string, string> = {
  "Cargo": "cargo_ship",
  "Tanker": "oil_tanker",
  "Passenger": "cargo_ship",
  "Fishing": "cargo_ship",
  "Tug": "cargo_ship",
  "Other": "cargo_ship",
};

// Navigational status codes
const STATUS_MAP: Record<number, string> = {
  0: "en_route",
  1: "at_anchor",
  2: "unloading",
  3: "loading",
  4: "loading",
  5: "at_anchor",
  6: "en_route",
  7: "en_route",
  8: "en_route",
  15: "en_route",
};

async function fetchNearbyVessels(
  lat_min: number,
  lat_max: number,
  long_min: number,
  long_max: number
): Promise<typeof cachedVessels> {
  if (!env.marinesiaApiKey) return null;

  try {
    const url = `${MARINESIA_BASE}/vessel/nearby?key=${env.marinesiaApiKey}&lat_min=${lat_min}&lat_max=${lat_max}&long_min=${long_min}&long_max=${long_max}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      console.error(`Marinesia API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json() as {
      error: boolean;
      message: string;
      data?: Array<{
        mmsi: number;
        lat: number;
        lng: number;
        ts: string;
        cog: number;
        sog: number;
        hdt: number;
        status: number;
        dest?: string;
        eta?: string;
        pos_acc?: boolean;
        valid?: boolean;
      }>;
    };

    if (json.error || !json.data) {
      console.error("Marinesia API returned error:", json.message);
      return null;
    }

    // Fetch vessel profiles to get ship types
    const vesselsWithProfiles = await Promise.all(
      json.data.map(async (vessel) => {
        try {
          const profileUrl = `${MARINESIA_BASE}/vessel/${vessel.mmsi}/profile?key=${env.marinesiaApiKey}`;
          const profileRes = await fetch(profileUrl, { headers: { Accept: "application/json" } });
          if (profileRes.ok) {
            const profileJson = await profileRes.json() as {
              error: boolean;
              data?: { name: string; ship_type: string };
            };
            if (!profileJson.error && profileJson.data) {
              return {
                mmsi: vessel.mmsi,
                name: profileJson.data.name || `Vessel-${vessel.mmsi}`,
                lat: vessel.lat,
                lng: vessel.lng,
                cog: vessel.cog,
                sog: vessel.sog,
                hdt: vessel.hdt,
                status: vessel.status,
                ship_type: profileJson.data.ship_type,
                dest: vessel.dest,
                eta: vessel.eta,
                timestamp: vessel.ts,
              };
            }
          }
        } catch {
          // Profile fetch failed, use basic data
        }
        return {
          mmsi: vessel.mmsi,
          name: `Vessel-${vessel.mmsi}`,
          lat: vessel.lat,
          lng: vessel.lng,
          cog: vessel.cog,
          sog: vessel.sog,
          hdt: vessel.hdt,
          status: vessel.status,
          ship_type: undefined,
          dest: vessel.dest,
          eta: vessel.eta,
          timestamp: vessel.ts,
        };
      })
    );

    return vesselsWithProfiles;
  } catch (error) {
    console.error("Marinesia API fetch error:", error);
    return null;
  }
}

export async function getRealVesselLocations() {
  const now = Date.now();

  // Return cached data if still fresh
  if (cachedVessels && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedVessels;
  }

  // If no API key, return null to trigger fallback
  if (!env.marinesiaApiKey) {
    return null;
  }

  // Fetch vessels from all scan regions
  const allVessels: NonNullable<typeof cachedVessels> = [];
  const seenMmsi = new Set<number>();

  for (const region of SCAN_REGIONS) {
    try {
      const vessels = await fetchNearbyVessels(
        region.lat_min,
        region.lat_max,
        region.long_min,
        region.long_max
      );
      if (vessels) {
        for (const v of vessels) {
          if (!seenMmsi.has(v.mmsi)) {
            seenMmsi.add(v.mmsi);
            allVessels.push(v);
          }
        }
      }
      // Rate limit: wait between requests to be respectful
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`Error fetching vessels from ${region.name}:`, e);
    }
  }

  if (allVessels.length > 0) {
    cachedVessels = allVessels;
    lastFetchTime = now;
  }

  return cachedVessels;
}

export function mapToDashboardVessel(
  v: NonNullable<typeof cachedVessels>[0]
): {
  name: string;
  type: "oil_tanker" | "cargo_ship" | "cargo_plane";
  callsign: string;
  lat: number;
  lng: number;
  heading: number;
  status: string;
  speed: number;
  cargoType: string;
  cargoWeight: number;
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  eta: Date | null;
  progress: number;
  lastUpdate: Date;
} {
  const mappedType = SHIP_TYPE_MAP[v.ship_type || "Other"] || "cargo_ship";
  const mappedStatus = STATUS_MAP[v.status] || "en_route";

  return {
    name: v.name,
    type: mappedType as "oil_tanker" | "cargo_ship" | "cargo_plane",
    callsign: `MMSI-${v.mmsi}`,
    lat: v.lat,
    lng: v.lng,
    heading: v.hdt || v.cog || 0,
    status: mappedStatus,
    speed: v.sog || 0,
    cargoType: v.ship_type || "Unknown",
    cargoWeight: 0,
    origin: null,
    destination: v.dest ? null : null, // We don't have dest coordinates, just text
    eta: v.eta ? new Date() : null,
    progress: 0,
    lastUpdate: new Date(v.timestamp),
  };
}
