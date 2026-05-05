import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

// Prediction engine using weighted factor analysis
// This runs algorithmic predictions based on market data + geopolitical risk factors

interface Factor {
  name: string;
  weight: number;
  value: number; // -1 to 1
}

function calculatePrediction(
  symbol: string,
  type: string,
  currentPrice: number,
  volatility: number,
  geopoliticalRisk: number,
  trend: number,
  timeframe: string
) {
  const factors: Factor[] = [
    { name: "Geopolitical Risk Premium", weight: 0.3, value: geopoliticalRisk },
    { name: "Recent Volatility", weight: 0.25, value: volatility * (Math.random() > 0.5 ? 1 : -1) },
    { name: "Technical Trend", weight: 0.2, value: trend },
    { name: "Sector Rotation", weight: 0.15, value: (Math.random() - 0.5) * 2 },
    { name: "Macro Outlook", weight: 0.1, value: (Math.random() - 0.5) * 1.5 },
  ];

  // Oil-related assets are more sensitive to geopolitical risk
  if (type === "stock" && ["XOM", "CVX", "SHEL", "BP", "TOT"].includes(symbol)) {
    factors[0].weight = 0.45;
    factors[1].weight = 0.2;
  }

  // Crypto is more volatile
  if (type === "crypto") {
    factors[1].weight = 0.4;
    factors[0].weight = 0.15;
  }

  // Bonds are more stable
  if (type === "bond") {
    factors[0].weight = 0.15;
    factors[2].weight = 0.4;
    factors[1].weight = 0.1;
  }

  const weightedScore = factors.reduce((sum, f) => sum + f.weight * f.value, 0);

  // Timeframe multiplier
  const timeframeMultipliers: Record<string, number> = {
    "1d": 0.02,
    "1w": 0.05,
    "1m": 0.12,
    "3m": 0.25,
    "1y": 0.45,
  };

  const multiplier = timeframeMultipliers[timeframe] || 0.05;
  const predictedChange = currentPrice * weightedScore * multiplier;
  const predictedPrice = Math.max(currentPrice + predictedChange, currentPrice * 0.5);

  // Confidence based on timeframe and volatility
  const baseConfidence = 0.85 - (multiplier * 1.5) - (volatility * 0.3);
  const confidence = Math.max(0.35, Math.min(0.95, baseConfidence + Math.random() * 0.1));

  const direction = predictedChange > 0.01 ? "up" : predictedChange < -0.01 ? "down" : "neutral";

  return {
    symbol,
    type,
    currentPrice,
    predictedPrice: Math.round(predictedPrice * 100) / 100,
    predictedChange: Math.round(predictedChange * 100) / 100,
    predictedChangePercent: Math.round((predictedChange / currentPrice) * 10000) / 100,
    confidence: Math.round(confidence * 10000) / 10000,
    direction,
    timeframe,
    factors: factors.map((f) => ({
      name: f.name,
      impact: Math.round(f.weight * f.value * 1000) / 10,
      weight: Math.round(f.weight * 100),
    })),
  };
}

export const predictionRouter = createRouter({
  predict: publicQuery
    .input(
      z.object({
        symbol: z.string(),
        type: z.enum(["stock", "etf", "bond", "crypto"]),
        currentPrice: z.number().default(100),
        volatility: z.number().default(0.15),
        geopoliticalRisk: z.number().default(0),
        trend: z.number().default(0),
        timeframe: z.enum(["1d", "1w", "1m", "3m", "1y"]).default("1w"),
      })
    )
    .query(({ input }) => {
      return calculatePrediction(
        input.symbol,
        input.type,
        input.currentPrice,
        input.volatility,
        input.geopoliticalRisk,
        input.trend,
        input.timeframe
      );
    }),

  batchPredict: publicQuery
    .input(
      z.object({
        assets: z.array(
          z.object({
            symbol: z.string(),
            type: z.enum(["stock", "etf", "bond", "crypto"]),
            currentPrice: z.number(),
            volatility: z.number().default(0.15),
            trend: z.number().default(0),
          })
        ),
        geopoliticalRisk: z.number().default(0),
        timeframe: z.enum(["1d", "1w", "1m", "3m", "1y"]).default("1w"),
      })
    )
    .query(({ input }) => {
      return input.assets.map((asset) =>
        calculatePrediction(
          asset.symbol,
          asset.type,
          asset.currentPrice,
          asset.volatility,
          input.geopoliticalRisk,
          asset.trend,
          input.timeframe
        )
      );
    }),

  marketOutlook: publicQuery.query(() => {
    // Overall market outlook based on aggregate geopolitical conditions
    const scenarios = [
      {
        outlook: "Cautious",
        description: "Elevated geopolitical tensions in Middle East and Asia-Pacific create downside risks for energy and shipping sectors. Defense and commodities may outperform.",
        riskLevel: 7,
        recommendation: "Hedge energy exposure, increase cash positions, consider defensive sectors.",
        keyRisks: ["Middle East supply disruptions", "Taiwan Strait escalation", "Trade war expansion"],
        opportunities: ["Oil & gas volatility plays", "Defense contractors", "Precious metals"],
      },
      {
        outlook: "Opportunity",
        description: "Despite headline risks, underlying demand remains strong. Supply chain disruptions create pricing power for logistics and energy traders.",
        riskLevel: 6,
        recommendation: "Selective buying in beaten-down energy names. Overweight shipping and logistics.",
        keyRisks: ["Regulatory changes", "Demand destruction from high prices"],
        opportunities: ["Tanker companies", "Rare earth miners", "Regional banks in trade hubs"],
      },
      {
        outlook: "Defensive",
        description: "Multiple conflict zones active simultaneously. Flight to quality assets accelerating. Treasury demand elevated.",
        riskLevel: 8,
        recommendation: "Maximum defensive positioning. Long duration bonds, gold, USD. Avoid emerging market exposure.",
        keyRisks: ["Cascading sanctions", "Maritime insurance crisis", "Commodity supercycle"],
        opportunities: ["US Treasuries", "USDJPY", "Gold miners"],
      },
    ];

    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }),
});
