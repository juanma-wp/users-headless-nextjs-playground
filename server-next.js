// server.js (or wp-server.js)
import { createServer } from "http";
import next from "next";
import { parse } from "url";
import cookieParser from "cookie-parser";
import { handlerPromise } from "./server-wp.js";
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
  const wpHandler = await handlerPromise;

  createServer((req, res) => {
    runMiddleware(req, res, middlewares, (err) => {
      if (err) {
        res.statusCode = 500;
        res.end("Middleware error");
        return;
      }
      // Route /wp requests to the WordPress Playground handler
      if (req.url.startsWith("/wp")) {
        (async () => {
          // Convert Node.js IncomingMessage to PHPRequest
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks);

          // Clone headers and set Host/X-Forwarded-Proto
          const headers = { ...req.headers };
          headers['host'] = req.headers.host;
          headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'http';

          // Force Accept header for REST API root
          if (req.url === '/wp/wp-json/' || req.url === '/wp/wp-json') {
            headers['accept'] = 'application/json';
          }

          // Log incoming headers
          console.log('--- Incoming Request Headers to Playground ---');
          console.log(headers);

          const phpRequest = {
            url: req.url,
            method: req.method,
            headers,
            body: body.length ? body : undefined,
          };
          // Call the PHP Playground handler
          const phpResponse = await wpHandler.request(phpRequest);

          // Log all headers
          console.log('--- PHP Playground Response Headers ---');
          for (const [key, value] of Object.entries(phpResponse.headers || {})) {
            console.log(`${key}:`, value);
          }
          // Log first 500 bytes of the response body
          const previewBody = Buffer.from(phpResponse.bytes).toString('utf8', 0, 500);
          console.log('--- PHP Playground Response Body (first 500 bytes) ---');
          console.log(previewBody);

          // Write status
          res.statusCode = phpResponse.httpStatusCode || 200;
          // Write headers, rewriting Location if present
          for (const [key, value] of Object.entries(phpResponse.headers || {})) {
            if (key.toLowerCase() === "location") {
              // Handle both string and array values
              const values = Array.isArray(value) ? value : [value];
              const rewritten = values.map((loc) => {
                try {
                  const playgroundUrl = new URL(loc, `http://${req.headers.host}`);
                  playgroundUrl.host = req.headers.host;
                  playgroundUrl.protocol = req.headers["x-forwarded-proto"] || "http:";
                  return playgroundUrl.toString();
                } catch (e) {
                  return loc;
                }
              });
              res.setHeader(key, rewritten.length === 1 ? rewritten[0] : rewritten);
            } else {
              res.setHeader(key, value);
            }
          }
          // Log outgoing status and headers
          console.log('--- Outgoing Response Status ---');
          console.log(res.statusCode);
          console.log('--- Outgoing Response Headers ---');
          console.log(res.getHeaders());
          // Write body
          res.end(Buffer.from(phpResponse.bytes));
        })();
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
