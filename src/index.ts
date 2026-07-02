import { serve } from "@hono/node-server";
import { getConnInfo } from "@hono/node-server/conninfo"
import app from "./app.tsx";
// import "./logging.ts";

const server = serve({
  port: 3251,
  fetch: app.fetch.bind(app),
});

console.log("Server started at", server.address() )
