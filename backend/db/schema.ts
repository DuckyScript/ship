import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  float,
  int,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const vessels = mysqlTable("vessels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["oil_tanker", "cargo_ship", "cargo_plane"]).notNull(),
  callsign: varchar("callsign", { length: 50 }),
  lat: decimal("lat", { precision: 10, scale: 6 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 6 }).notNull(),
  origin: varchar("origin", { length: 255 }),
  destination: varchar("destination", { length: 255 }),
  speed: float("speed"),
  heading: float("heading"),
  status: mysqlEnum("status", ["en_route", "at_port", "loading", "unloading", "idle"]).default("en_route"),
  cargoType: varchar("cargo_type", { length: 255 }),
  cargoWeight: int("cargo_weight"),
  lastUpdate: timestamp("last_update").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vessel = typeof vessels.$inferSelect;
export type InsertVessel = typeof vessels.$inferInsert;

export const politicalEvents = mysqlTable("political_events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 255 }),
  country: varchar("country", { length: 255 }),
  severity: int("severity").notNull().default(5),
  category: mysqlEnum("category", [
    "conflict",
    "trade_war",
    "sanctions",
    "election",
    "policy",
    "diplomacy",
    "crisis",
    "regulation",
  ]).notNull(),
  source: varchar("source", { length: 255 }),
  url: text("url"),
  impactAreas: varchar("impact_areas", { length: 500 }),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PoliticalEvent = typeof politicalEvents.$inferSelect;
export type InsertPoliticalEvent = typeof politicalEvents.$inferInsert;

export const marketAssets = mysqlTable("market_assets", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["stock", "etf", "bond", "crypto"]).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }),
  change: decimal("change", { precision: 18, scale: 8 }),
  changePercent: decimal("change_percent", { precision: 10, scale: 4 }),
  volume: bigint("volume", { mode: "number", unsigned: true }),
  marketCap: decimal("market_cap", { precision: 24, scale: 2 }),
  high24h: decimal("high_24h", { precision: 18, scale: 8 }),
  low24h: decimal("low_24h", { precision: 18, scale: 8 }),
  lastUpdate: timestamp("last_update").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketAsset = typeof marketAssets.$inferSelect;
export type InsertMarketAsset = typeof marketAssets.$inferInsert;

export const predictions = mysqlTable("predictions", {
  id: serial("id").primaryKey(),
  assetId: bigint("asset_id", { mode: "number", unsigned: true }).notNull(),
  predictedPrice: decimal("predicted_price", { precision: 18, scale: 8 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  timeframe: mysqlEnum("timeframe", ["1d", "1w", "1m", "3m", "1y"]).notNull(),
  factors: text("factors"),
  direction: mysqlEnum("direction", ["up", "down", "neutral"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;
