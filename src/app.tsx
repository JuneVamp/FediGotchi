import { Hono } from "hono";
import { cors } from "hono/cors";
import { Simulation } from "./simulation";
import { SERVER_URL } from "./serverConfig";
import { createPetRoutes } from "./routes/petRoutes";
import { createEnvironmentRoutes } from "./routes/environmentRoutes";
import { createActivityRoutes } from "./routes/activityRoutes";
import { serveStatic } from "@hono/node-server/serve-static";

type AppEnv = {}

const app = new Hono<AppEnv>()

app.use("/*",
  cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
}));


const mainSimulation = new Simulation(SERVER_URL);

mainSimulation.initializeEnvironments();
mainSimulation.initializePets();
mainSimulation.startSimulationTicker();

app.route("/api/pets", createPetRoutes(mainSimulation.pets));
app.route("/api/environments", createEnvironmentRoutes(mainSimulation.environments));
app.route("/api/activities", createActivityRoutes(mainSimulation.activities));

app.get("/*", serveStatic({ root: "./public" }));

export default app