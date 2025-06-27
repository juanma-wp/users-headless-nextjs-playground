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
  // ✅ Run code here before server starts
  await handlerPromise;

  createServer((req, res) => {
    runMiddleware(req, res, middlewares, (err) => {
      if (err) {
        res.statusCode = 500;
        res.end("Middleware error");
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
