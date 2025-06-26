// server.js (or wp-server.js)
import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { handlerPromise } from "./server-wp.js";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // ✅ Run code here before server starts
  await handlerPromise;

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});
