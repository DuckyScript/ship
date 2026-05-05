import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { getRealVesselLocations, mapToDashboardVessel } from "./lib/marinesia";

// Major trade routes with waypoints for realistic vessel simulation
const ROUTES: Record<string, { waypoints: { lat: number; lng: number }[]; distance: number }> = {
  persian_gulf_asia: {
    waypoints: [
      { lat: 25.276987, lng: 55.296249 },
      { lat: 20.0, lng: 60.0 },
      { lat: 10.0, lng: 70.0 },
      { lat: 6.927079, lng: 79.861244 },
      { lat: 1.352083, lng: 103.819836 },
      { lat: 22.3193, lng: 114.1694 },
    ],
    distance: 6200,
  },
  north_sea_americas: {
    waypoints: [
      { lat: 58.5, lng: -3.0 },
      { lat: 55.0, lng: -20.0 },
      { lat: 45.0, lng: -45.0 },
      { lat: 40.7128, lng: -74.006 },
      { lat: 29.7604, lng: -95.3698 },
    ],
    distance: 7500,
  },
  pacific_rim: {
    waypoints: [
      { lat: 35.6762, lng: 139.6503 },
      { lat: 40.0, lng: 160.0 },
      { lat: 45.0, lng: -130.0 },
      { lat: 37.7749, lng: -122.4194 },
      { lat: 33.8688, lng: -118.2093 },
    ],
    distance: 8900,
  },
  suez_europe_asia: {
    waypoints: [
      { lat: 31.2001, lng: 29.9187 },
      { lat: 29.9773, lng: 32.5561 },
      { lat: 20.0, lng: 55.0 },
      { lat: 10.0, lng: 70.0 },
      { lat: 1.352083, lng: 103.819836 },
      { lat: 22.3193, lng: 114.1694 },
    ],
    distance: 7800,
  },
  baltic_black_sea: {
    waypoints: [
      { lat: 59.9311, lng: 30.3609 },
      { lat: 55.7558, lng: 37.6173 },
      { lat: 41.0082, lng: 28.9784 },
      { lat: 37.9838, lng: 23.7275 },
    ],
    distance: 3200,
  },
  panama_route: {
    waypoints: [
      { lat: 9.0, lng: -79.5 },
      { lat: 15.0, lng: -100.0 },
      { lat: 22.0, lng: -120.0 },
      { lat: 37.7749, lng: -122.4194 },
      { lat: 47.6062, lng: -122.3321 },
    ],
    distance: 6500,
  },
};

const AIR_ROUTES: Record<string, { waypoints: { lat: number; lng: number }[]; distance: number }> = {
  asia_europe_air: {
    waypoints: [
      { lat: 22.3193, lng: 114.1694 },
      { lat: 35.0, lng: 90.0 },
      { lat: 50.0, lng: 60.0 },
      { lat: 52.52, lng: 13.405 },
      { lat: 51.5074, lng: -0.1278 },
    ],
    distance: 8900,
  },
  americas_europe_air: {
    waypoints: [
      { lat: 40.7128, lng: -74.006 },
      { lat: 50.0, lng: -50.0 },
      { lat: 53.0, lng: -20.0 },
      { lat: 51.5074, lng: -0.1278 },
      { lat: 52.52, lng: 13.405 },
    ],
    distance: 6400,
  },
  pacific_air: {
    waypoints: [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 40.0, lng: -160.0 },
      { lat: 35.0, lng: 150.0 },
      { lat: 35.6762, lng: 139.6503 },
      { lat: 22.3193, lng: 114.1694 },
    ],
    distance: 11000,
  },
};

type VesselConfig = {
  name: string;
  type: "oil_tanker" | "cargo_ship" | "cargo_plane";
  callsign: string;
  route: string;
  speed: number;
  cargo: string;
  weight: number;
};

const VESSEL_DATA: VesselConfig[] = [
  { name: "MT Horizon Star", type: "oil_tanker", callsign: "HST123", route: "persian_gulf_asia", speed: 14, cargo: "Crude Oil", weight: 320000 },
  { name: "MT Gulf Monarch", type: "oil_tanker", callsign: "GMN456", route: "persian_gulf_asia", speed: 13, cargo: "Crude Oil", weight: 280000 },
  { name: "MT Atlantic Voyager", type: "oil_tanker", callsign: "ATV789", route: "north_sea_americas", speed: 15, cargo: "Brent Crude", weight: 250000 },
  { name: "MT Nordic Spirit", type: "oil_tanker", callsign: "NSP321", route: "north_sea_americas", speed: 14, cargo: "North Sea Oil", weight: 300000 },
  { name: "MT Pacific Pearl", type: "oil_tanker", callsign: "PPL654", route: "pacific_rim", speed: 13, cargo: "Russian ESPO", weight: 200000 },
  { name: "MT Suez Legend", type: "oil_tanker", callsign: "SLG987", route: "suez_europe_asia", speed: 15, cargo: "Condensate", weight: 220000 },
  { name: "MT Black Sea Titan", type: "oil_tanker", callsign: "BST147", route: "baltic_black_sea", speed: 12, cargo: "Urals Crude", weight: 180000 },
  { name: "MT Caspian Crown", type: "oil_tanker", callsign: "CCN258", route: "baltic_black_sea", speed: 13, cargo: "Kazakh Crude", weight: 210000 },
  { name: "CS Evergreen", type: "cargo_ship", callsign: "EVG369", route: "pacific_rim", speed: 22, cargo: "Electronics", weight: 15000 },
  { name: "CS Pacific Trade", type: "cargo_ship", callsign: "PTR741", route: "panama_route", speed: 20, cargo: "Automobiles", weight: 12000 },
  { name: "CS Atlantic Bridge", type: "cargo_ship", callsign: "ABG852", route: "north_sea_americas", speed: 21, cargo: "Machinery", weight: 18000 },
  { name: "CS Suez Express", type: "cargo_ship", callsign: "SXP963", route: "suez_europe_asia", speed: 23, cargo: "Textiles", weight: 10000 },
  { name: "CS Indian Meridian", type: "cargo_ship", callsign: "IMD159", route: "persian_gulf_asia", speed: 20, cargo: "Petrochemicals", weight: 14000 },
  { name: "CS Baltic Trader", type: "cargo_ship", callsign: "BTR753", route: "baltic_black_sea", speed: 19, cargo: "Grain", weight: 20000 },
  { name: "CS Panama Giant", type: "cargo_ship", callsign: "PGT951", route: "panama_route", speed: 21, cargo: "Containers", weight: 16000 },
  { name: "CS Global Meridian", type: "cargo_ship", callsign: "GMD357", route: "pacific_rim", speed: 22, cargo: "Raw Materials", weight: 13000 },
  { name: "CP Swift Freight", type: "cargo_plane", callsign: "SWF159", route: "asia_europe_air", speed: 850, cargo: "High-Value Goods", weight: 120 },
  { name: "CP Euro Link", type: "cargo_plane", callsign: "ELL753", route: "americas_europe_air", speed: 900, cargo: "Pharma", weight: 95 },
  { name: "CP Pacific Air", type: "cargo_plane", callsign: "PAI951", route: "pacific_air", speed: 880, cargo: "Electronics", weight: 110 },
  { name: "CP Trans Atlantic", type: "cargo_plane", callsign: "TAL357", route: "americas_europe_air", speed: 870, cargo: "Perishables", weight: 85 },
  { name: "CP Silk Route", type: "cargo_plane", callsign: "SRT852", route: "asia_europe_air", speed: 890, cargo: "Luxury Goods", weight: 100 },
  { name: "CP Ocean Air", type: "cargo_plane", callsign: "OAR456", route: "pacific_air", speed: 860, cargo: "Auto Parts", weight: 105 },
];

function interpolatePosition(waypoints: { lat: number; lng: number }[], progress: number) {
  const totalSegments = waypoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.floor(segmentProgress);
  const localProgress = segmentProgress - segmentIndex;

  if (segmentIndex >= totalSegments) {
    return waypoints[totalSegments];
  }

  const start = waypoints[segmentIndex];
  const end = waypoints[segmentIndex + 1];

  return {
    lat: start.lat + (end.lat - start.lat) * localProgress,
    lng: start.lng + (end.lng - start.lng) * localProgress,
  };
}

function calculateHeading(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const dLon = (to.lng - from.lng) * (Math.PI / 180);
  const lat1 = from.lat * (Math.PI / 180);
  const lat2 = to.lat * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const heading = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
  return heading;
}

function getRouteForVessel(vessel: VesselConfig) {
  if (vessel.type === "cargo_plane") {
    return AIR_ROUTES[vessel.route] ?? null;
  }
  return ROUTES[vessel.route] ?? null;
}

function getSimulatedPosition(vessel: VesselConfig, now: number) {
  const route = getRouteForVessel(vessel);
  if (!route) return null;

  const hash = vessel.callsign.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cycleDuration = (route.distance / vessel.speed) * 3600000;
  const phaseOffset = ((hash % 1000) / 1000) * cycleDuration;
  const elapsed = (now + phaseOffset) % cycleDuration;
  const progress = elapsed / cycleDuration;

  const position = interpolatePosition(route.waypoints, progress);

  const totalSegments = route.waypoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const nextWaypoint = route.waypoints[segmentIndex + 1] || route.waypoints[totalSegments];
  const heading = calculateHeading(position, nextWaypoint);

  const atPortThreshold = 0.02;
  let status: string;
  if (progress < atPortThreshold || progress > 1 - atPortThreshold) {
    status = "at_port";
  } else if (Math.abs(progress - 0.5) < 0.01) {
    status = "loading";
  } else {
    status = "en_route";
  }

  return {
    ...position,
    heading,
    status,
    progress,
    routeDistance: route.distance,
    eta: new Date(now + (cycleDuration - elapsed)),
  };
}

export type VesselOutput = {
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
  isReal: boolean;
};

function getSimulatedVesselData(): VesselOutput[] {
  const now = Date.now();
  return VESSEL_DATA.map((v) => {
    const pos = getSimulatedPosition(v, now);
    const route = getRouteForVessel(v);

    return {
      name: v.name,
      type: v.type,
      callsign: v.callsign,
      lat: pos?.lat ?? 0,
      lng: pos?.lng ?? 0,
      heading: pos?.heading ?? 0,
      status: pos?.status ?? "en_route",
      speed: v.speed,
      cargoType: v.cargo,
      cargoWeight: v.weight,
      origin: route?.waypoints[0] ?? null,
      destination: route?.waypoints.slice(-1)[0] ?? null,
      eta: pos?.eta ?? null,
      progress: pos?.progress ?? 0,
      lastUpdate: new Date(),
      isReal: false,
    };
  });
}

async function getAllVesselData(): Promise<VesselOutput[]> {
  // Try to fetch real vessel data from Marinesia API
  const realVessels = await getRealVesselLocations();
  if (realVessels && realVessels.length > 0) {
    return realVessels.map((v) => ({
      ...mapToDashboardVessel(v),
      isReal: true,
    }));
  }
  // Fall back to simulated data
  return getSimulatedVesselData();
}

export const vesselRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const dbVessels = await db.query.vessels.findMany();

    if (dbVessels.length === 0) {
      return getAllVesselData();
    }

    return dbVessels.map((v) => ({
      name: v.name,
      type: v.type as "oil_tanker" | "cargo_ship" | "cargo_plane",
      callsign: v.callsign ?? "",
      lat: Number(v.lat),
      lng: Number(v.lng),
      heading: v.heading ?? 0,
      status: v.status ?? "en_route",
      speed: v.speed ?? 0,
      cargoType: v.cargoType ?? "",
      cargoWeight: v.cargoWeight ?? 0,
      origin: null,
      destination: null,
      eta: v.lastUpdate,
      progress: 0,
      lastUpdate: v.lastUpdate ?? new Date(),
      isReal: true,
    }));
  }),

  live: publicQuery.query(async () => {
    return getAllVesselData();
  }),

  byType: publicQuery
    .input(z.object({ type: z.enum(["oil_tanker", "cargo_ship", "cargo_plane"]) }))
    .query(async ({ input }) => {
      const all = await getAllVesselData();
      return all.filter((v: VesselOutput) => v.type === input.type);
    }),
});
