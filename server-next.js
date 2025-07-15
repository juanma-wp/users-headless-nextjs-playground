// server.js (or wp-server.js)
import { createServer } from "http";
import next from "next";
import { parse } from "url";
import cookieParser from "cookie-parser";
import { createPlaygroundHandler } from "./server-wp.js";
import { getRawBody } from "./utils/getRawBody.js";
//import cookie from "cookie";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

// function cookieParserMiddleware(req, res, next) {
//   const cookies = req.headers.cookie;
//   req.cookies = cookies ? cookie.parse(cookies) : {};
//   next();
// }
setInterval(() => {
  const used = process.memoryUsage();
  const now = new Date().toLocaleString();
  console.log('-----------------------------');
  console.log(`Memory usage at ${now}:`);
  console.log(`rss: ${(used.rss / 1024 / 1024).toFixed(2)} MB - Resident Set Size: total memory allocated for the process (includes all C++ and JS objects, stacks, etc.)`);
  console.log(`heapTotal: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB - V8's total heap size`);
  console.log(`heapUsed: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB - V8's used heap size`);
  console.log(`external: ${(used.external / 1024 / 1024).toFixed(2)} MB - Memory used by C++ objects bound to JS objects managed by V8`);
  console.log(`arrayBuffers: ${(used.arrayBuffers / 1024 / 1024).toFixed(2)} MB - Memory allocated for ArrayBuffers and SharedArrayBuffers`);
  console.log('-----------------------------\n');
}, 10000); // logs every 10 seconds
  
function runMiddleware(req, res, middlewares, done) {
  let i = 0;
  function next(err) {
    if (err || i === middlewares.length) return done(err);
    middlewares[i++](req, res, next);
  }
  next();
}

const middlewares = [cookieParser()];

app.prepare().then(async () => {
  const wpHandler = await createPlaygroundHandler();

  function rewriteLocationHeaders(headers, req) {
    const newHeaders = { ...headers };
    if (newHeaders["location"] || newHeaders["Location"]) {
      const key = newHeaders["location"] ? "location" : "Location";
      const values = Array.isArray(newHeaders[key]) ? newHeaders[key] : [newHeaders[key]];
      newHeaders[key] = values.map((loc) => {
        try {
          const url = new URL(loc, `http://${req.headers.host}`);
          url.host = req.headers.host;
          url.protocol = req.headers["x-forwarded-proto"] || "http:";
          return url.toString();
        } catch (e) {
          return loc;
        }
      });
      if (newHeaders[key].length === 1) newHeaders[key] = newHeaders[key][0];
    }
    return newHeaders;
  }

  createServer(async (req, res) => {
    runMiddleware(req, res, middlewares, async (err) => {
      if (err) {
        res.statusCode = 500;
        res.end("Middleware error");
        return;
      }
      // Route /wp requests to the WordPress Playground handler
      if (req.url.startsWith("/wp")) {
        // Collect body
        const body = await getRawBody(req);

        // Prepare headers
        const headers = { ...req.headers };
        headers["host"] = req.headers.host;
        headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] || "http";
        if (req.url === "/wp/wp-json/" || req.url === "/wp/wp-json") {
          headers["accept"] = "application/json";
        }

        // Logging (optional, can be toggled)
        console.log("--- Incoming Request Headers to Playground ---\n", headers);

        const phpRequest = {
          url: req.url,
          method: req.method,
          headers,
          body: body.length ? body : undefined,
        };
        const phpResponse = await wpHandler.request(phpRequest);

        // Log response headers and preview body
        // console.log("--- PHP Playground Response Headers ---\n", phpResponse.headers);
        // const previewBody = Buffer.from(phpResponse.bytes).toString("utf8", 0, 500);
        // console.log("--- PHP Playground Response Body (first 500 bytes) ---\n", previewBody);

        // Write status
        res.statusCode = phpResponse.httpStatusCode || 200;
        
        // Rewrite headers (especially Location)
        const outHeaders = rewriteLocationHeaders(phpResponse.headers || {}, req);
        for (const [key, value] of Object.entries(outHeaders)) {
          res.setHeader(key, value);
        }
        // Log outgoing status and headers
        console.log("--- Outgoing Response Status ---\n", res.statusCode);
        console.log("--- Outgoing Response Headers ---\n", res.getHeaders());
        // Write body
        res.end(Buffer.from(phpResponse.bytes));
        return;
      }
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });
  }).listen(port);

  console.log(
    `> NextJS Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});