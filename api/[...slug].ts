import { getRequestListener } from "@hono/node-server";
import app from "../backend/boot";

// IS_SERVERLESS=1 is set via vercel.json env so boot.ts skips starting a
// standalone HTTP server before this module is even loaded.

export const config = { runtime: "nodejs20.x" };

export default getRequestListener(app.fetch);
