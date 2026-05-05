import { authRouter } from "./auth-router";
import { vesselRouter } from "./vesselRouter";
import { politicalRouter } from "./politicalRouter";
import { marketRouter } from "./marketRouter";
import { predictionRouter } from "./predictionRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  vessel: vesselRouter,
  political: politicalRouter,
  market: marketRouter,
  prediction: predictionRouter,
});

export type AppRouter = typeof appRouter;
