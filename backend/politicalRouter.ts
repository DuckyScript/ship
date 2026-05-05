import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { politicalEvents } from "@db/schema";
import { desc, eq } from "drizzle-orm";

// Seed political events data - realistic current geopolitical issues
const SEED_EVENTS = [
  {
    title: "Middle East Shipping Tensions Disrupt Suez Canal Traffic",
    description: "Multiple shipping companies reroute vessels around Cape of Good Hope due to security concerns in Red Sea region. Insurance premiums for Red Sea transit have risen 300%.",
    region: "Middle East",
    country: "Yemen / Egypt",
    severity: 9,
    category: "conflict" as const,
    source: "Maritime Security Review",
    impactAreas: "shipping,insurance,oil,trade",
  },
  {
    title: "EU Imposes New Sanctions on Russian Oil Exports",
    description: "European Union announces 14th package of sanctions targeting Russian shadow fleet tankers. Over 100 vessels now designated, affecting 15% of global crude shipping capacity.",
    region: "Europe",
    country: "Russia / EU",
    severity: 8,
    category: "sanctions" as const,
    source: "EU Council",
    impactAreas: "oil,shipping,finance,energy",
  },
  {
    title: "China-Taiwan Strait Military Activity at 5-Year High",
    description: "Naval exercises and increased air patrols in Taiwan Strait disrupt commercial shipping lanes. Major carriers adding 2-3 days to Asia-Pacific routes.",
    region: "Asia Pacific",
    country: "China / Taiwan",
    severity: 8,
    category: "conflict" as const,
    source: "Asia Maritime Monitor",
    impactAreas: "shipping,semiconductors,technology,trade",
  },
  {
    title: "US-China Trade War Escalates with New Tariff Categories",
    description: "Biden administration announces 25% tariffs on Chinese EVs, batteries, and critical minerals. China retaliates with restrictions on rare earth exports.",
    region: "Global",
    country: "USA / China",
    severity: 7,
    category: "trade_war" as const,
    source: "Trade Policy Watch",
    impactAreas: "trade,automotive,technology,commodities",
  },
  {
    title: "Panama Canal Restrictions Extended Through 2026",
    description: "Ongoing drought conditions force Panama Canal Authority to maintain reduced transit slots. Daily passages capped at 27, down from 36 normal capacity.",
    region: "Americas",
    country: "Panama",
    severity: 6,
    category: "crisis" as const,
    source: "Panama Canal Authority",
    impactAreas: "shipping,agriculture,energy,logistics",
  },
  {
    title: "India-Bangladesh Border Trade Dispute Flares",
    description: "New customs regulations and border checkpoints cause 48-hour delays in garment and textile shipments affecting $12B annual trade.",
    region: "South Asia",
    country: "India / Bangladesh",
    severity: 5,
    category: "policy" as const,
    source: "South Asia Trade Monitor",
    impactAreas: "trade,textiles,manufacturing",
  },
  {
    title: "Nigeria Pipeline Attacks Disrupt West African Oil Exports",
    description: "Militant groups target Shell and Chevron infrastructure. Production down 400,000 barrels/day. European refiners seeking alternative Atlantic crude sources.",
    region: "Africa",
    country: "Nigeria",
    severity: 7,
    category: "conflict" as const,
    source: "African Energy Report",
    impactAreas: "oil,energy,shipping,security",
  },
  {
    title: "Arctic Shipping Route Opens 3 Weeks Early",
    description: "Northern Sea Route ice melt enables earlier transit. Russian LNG tankers and Chinese cargo vessels begin summer season ahead of schedule.",
    region: "Arctic",
    country: "Russia",
    severity: 4,
    category: "policy" as const,
    source: "Arctic Maritime Institute",
    impactAreas: "shipping,energy,climate,trade",
  },
  {
    title: "UK Election Brings Potential Shipping Tax Reforms",
    description: "Labour party manifesto proposes tonnage tax changes and emissions regulations for UK-flagged vessels. Industry lobbying intensifies.",
    region: "Europe",
    country: "United Kingdom",
    severity: 5,
    category: "election" as const,
    source: "UK Maritime Weekly",
    impactAreas: "shipping,finance,regulation",
  },
  {
    title: "South China Sea Territorial Dispute Impacts Fishing and Trade",
    description: "Philippines-China standoff at Second Thomas Shoal escalates with coast guard collisions. Risk to $3.4T annual trade passing through region.",
    region: "Asia Pacific",
    country: "Philippines / China",
    severity: 7,
    category: "diplomacy" as const,
    source: "Indo-Pacific Security Review",
    impactAreas: "shipping,fishing,trade,security",
  },
  {
    title: "Green Fuel Regulations Drive Tanker Fleet Retrofitting",
    description: "IMO 2024 emissions standards force 2,000+ vessels to retrofit scrubbers or switch to LNG propulsion. Shipyard capacity fully booked through 2027.",
    region: "Global",
    country: "International",
    severity: 6,
    category: "regulation" as const,
    source: "IMO / Maritime Executive",
    impactAreas: "shipping,energy,environment,finance",
  },
  {
    title: "Iran Nuclear Talks Stall - Strait of Hormuz Risk Premium Rises",
    description: "Diplomatic negotiations suspended. Oil traders pricing in 15% risk premium for Hormuz transit. Alternative UAE-Saudi pipeline demand surges.",
    region: "Middle East",
    country: "Iran",
    severity: 9,
    category: "diplomacy" as const,
    source: "Middle East Energy Monitor",
    impactAreas: "oil,energy,shipping,insurance",
  },
];

export const politicalRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    let events = await db.query.politicalEvents.findMany({
      orderBy: desc(politicalEvents.publishedAt),
    });

    // Seed if empty
    if (events.length === 0) {
      for (const event of SEED_EVENTS) {
        await db.insert(politicalEvents).values({
          ...event,
          publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      }
      events = await db.query.politicalEvents.findMany({
        orderBy: desc(politicalEvents.publishedAt),
      });
    }

    return events;
  }),

  byCategory: publicQuery
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.politicalEvents.findMany({
        where: eq(politicalEvents.category, input.category as any),
        orderBy: desc(politicalEvents.publishedAt),
      });
    }),

  byRegion: publicQuery
    .input(z.object({ region: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.politicalEvents.findMany({
        where: eq(politicalEvents.region, input.region),
        orderBy: desc(politicalEvents.publishedAt),
      });
    }),

  severityStats: publicQuery.query(async () => {
    const db = getDb();
    const allEvents = await db.query.politicalEvents.findMany();

    const stats = {
      byCategory: {} as Record<string, { count: number; avgSeverity: number }>,
      byRegion: {} as Record<string, { count: number; avgSeverity: number }>,
      total: allEvents.length,
      critical: allEvents.filter((e) => e.severity >= 8).length,
      high: allEvents.filter((e) => e.severity >= 6 && e.severity < 8).length,
    };

    for (const event of allEvents) {
      if (!stats.byCategory[event.category]) {
        stats.byCategory[event.category] = { count: 0, avgSeverity: 0 };
      }
      stats.byCategory[event.category].count++;
      stats.byCategory[event.category].avgSeverity += event.severity;

      if (!stats.byRegion[event.region || "Unknown"]) {
        stats.byRegion[event.region || "Unknown"] = { count: 0, avgSeverity: 0 };
      }
      stats.byRegion[event.region || "Unknown"].count++;
      stats.byRegion[event.region || "Unknown"].avgSeverity += event.severity;
    }

    for (const cat of Object.keys(stats.byCategory)) {
      stats.byCategory[cat].avgSeverity = Math.round(
        (stats.byCategory[cat].avgSeverity / stats.byCategory[cat].count) * 10
      ) / 10;
    }

    for (const reg of Object.keys(stats.byRegion)) {
      stats.byRegion[reg].avgSeverity = Math.round(
        (stats.byRegion[reg].avgSeverity / stats.byRegion[reg].count) * 10
      ) / 10;
    }

    return stats;
  }),
});
