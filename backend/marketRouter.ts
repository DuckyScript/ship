import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

const ASSETS_CONFIG = [
  { symbol: "XOM", name: "Exxon Mobil", type: "stock" as const },
  { symbol: "CVX", name: "Chevron", type: "stock" as const },
  { symbol: "SHEL", name: "Shell PLC", type: "stock" as const },
  { symbol: "BP", name: "BP PLC", type: "stock" as const },
  { symbol: "TOT", name: "TotalEnergies", type: "stock" as const },
  { symbol: "MAERSK.B", name: "Maersk", type: "stock" as const },
  { symbol: "FDX", name: "FedEx", type: "stock" as const },
  { symbol: "UPS", name: "UPS", type: "stock" as const },
  { symbol: "USO", name: "US Oil Fund", type: "etf" as const },
  { symbol: "XLE", name: "Energy Select SPDR", type: "etf" as const },
  { symbol: "XLF", name: "Financial Select SPDR", type: "etf" as const },
  { symbol: "VTI", name: "Total Stock Market", type: "etf" as const },
  { symbol: "TLT", name: "20+ Year Treasury", type: "bond" as const },
  { symbol: "HYG", name: "High Yield Corp Bond", type: "bond" as const },
  { symbol: "LQD", name: "Invst Grade Corp Bond", type: "bond" as const },
  { symbol: "BND", name: "Total Bond Market", type: "bond" as const },
];

const CRYPTO_PAIRS = [
  { symbol: "BTCUSDT", name: "Bitcoin", type: "crypto" as const },
  { symbol: "ETHUSDT", name: "Ethereum", type: "crypto" as const },
  { symbol: "BNBUSDT", name: "BNB", type: "crypto" as const },
  { symbol: "SOLUSDT", name: "Solana", type: "crypto" as const },
];

const STOCK_FALLBACKS: Record<string, number> = {
  XOM: 115.5, CVX: 155.2, SHEL: 72.8, BP: 38.4, TOT: 65.3,
  "MAERSK.B": 14500, FDX: 285.4, UPS: 172.3,
  USO: 77.5, XLE: 96.2, XLF: 42.8, VTI: 270.5,
  TLT: 92.4, HYG: 77.3, LQD: 108.6, BND: 73.2,
};

const CRYPTO_FALLBACKS: Record<string, number> = {
  BTCUSDT: 67500, ETHUSDT: 3450, BNBUSDT: 595, SOLUSDT: 145,
};

type PriceResult = {
  symbol: string;
  name: string;
  type: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
};

function generateStockData(): PriceResult[] {
  return ASSETS_CONFIG.map((asset) => {
    const basePrice = STOCK_FALLBACKS[asset.symbol] || 100;
    const change = (Math.random() - 0.5) * basePrice * 0.03;
    return {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      price: Math.round((basePrice + change) * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 10000000) + 500000,
      high24h: Math.round(basePrice * 1.02 * 100) / 100,
      low24h: Math.round(basePrice * 0.98 * 100) / 100,
      marketCap: Math.round(basePrice * 1000000000),
    };
  });
}

function generateCryptoData(): PriceResult[] {
  return CRYPTO_PAIRS.map((asset) => {
    const basePrice = CRYPTO_FALLBACKS[asset.symbol] || 100;
    const change = (Math.random() - 0.5) * basePrice * 0.05;
    return {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      price: Math.round((basePrice + change) * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 500000) + 100000,
      high24h: Math.round(basePrice * 1.04 * 100) / 100,
      low24h: Math.round(basePrice * 0.96 * 100) / 100,
    };
  });
}

function generateChartData(period: string) {
  const basePrice = 100;
  const days = period === "1mo" ? 30 : period === "3mo" ? 90 : 30;
  const data: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> = [];
  let price = basePrice;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * 3;
    price += change;
    const open = price - (Math.random() - 0.5) * 2;
    const close = price;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    data.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  return data;
}

export const marketRouter = createRouter({
  livePrices: publicQuery.query(async () => {
    const results: PriceResult[] = [...generateStockData(), ...generateCryptoData()];
    return results;
  }),

  byType: publicQuery
    .input(z.object({ type: z.enum(["stock", "etf", "bond", "crypto"]) }))
    .query(async ({ input }) => {
      const all = [...generateStockData(), ...generateCryptoData()];
      return all.filter((a) => a.type === input.type);
    }),

  chartData: publicQuery
    .input(z.object({ symbol: z.string(), period: z.string().default("1mo") }))
    .query(({ input }) => {
      return generateChartData(input.period);
    }),
});
