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

// HACK 8 Temporary bandwidth tracking middleware

let totalReceived = 0;
let totalSent = 0;

app.use("*", async (c, next) => {
    const contentLength = c.req.header("content-length");

    if (contentLength) {
        totalReceived += Number(contentLength);
    }

    await next();

    const response = c.res.clone();
    const body = await response.arrayBuffer();

    totalSent += body.byteLength;
});

app.get("/bandwidth", (c) => {
    return c.json({
        receivedBytes: totalReceived,
        sentBytes: totalSent,
        totalBytes: totalReceived + totalSent,
    });
});


// save the totalBytes to a csv every 2 seconds
setInterval(() => {
    const fs = require("fs");
    const data = {
        receivedBytes: totalReceived,
        sentBytes: totalSent,
        totalBytes: totalReceived + totalSent,
    };
    fs.appendFileSync("bandwidth.csv", `${data.receivedBytes},${data.sentBytes},${data.totalBytes}\n`);
}, 2000);

const mainSimulation = new Simulation(SERVER_URL);

mainSimulation.initializeEnvironments();
mainSimulation.initializePets();
mainSimulation.startSimulationTicker();

app.route("/api/pets", createPetRoutes(mainSimulation.pets));
app.route("/api/environments", createEnvironmentRoutes(mainSimulation.environments));
app.route("/api/activities", createActivityRoutes(mainSimulation.activities));

app.get("/*", serveStatic({ root: "./public" }));

export default app