import { behindProxy } from "x-forwarded-fetch";
import { serve } from "@hono/node-server";
import { getConnInfo } from "@hono/node-server/conninfo"
import {SERVER_PORT} from "./serverConfig.ts"
import app from "./app.tsx";
// import "./logging.ts";
console.log("Starting server on port", SERVER_PORT)

const port = parseInt(process.argv[2] || SERVER_PORT.toString(), 10);

const server = serve({
  port: port,
  // fetch: behindProxy(app.fetch.bind(app)),
  fetch: (req) => {
    const url = new URL(req.url)
    url.protocol =
      req.headers.get('x-forwarded-proto') ?? url.protocol
    return app.fetch(new Request(url, req))
  },
});

console.log("Server started at", server.address() )

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
});