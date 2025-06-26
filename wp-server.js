import { runCLI } from "@wp-playground/cli";
import { readFileSync } from "fs";
import { resolve } from "path";

async function getWpPlaygroundUrl() {
  try {
    const blueprint = JSON.parse(
      readFileSync(resolve("./blueprint.json"), "utf8")
    );

    const cliServer = await runCLI({
      command: "server",
      blueprint,
    });

    const handler = cliServer.requestHandler;
    const wpAbsoluteUrl = handler.absoluteUrl;

    return wpAbsoluteUrl;
  } catch (error) {
    console.error("Error starting WP Playground server:", error);
    return "http://localhost:8000"; // Fallback URL
  }
}

await (async () => {
  const url = await getWpPlaygroundUrl();
  process.env.DYNAMIC_WP_URL = url;
  process.env.DYNAMIC_JWT_AUTH_URL = url.replace(
    "/wp-json",
    "/wp-json/jwt-auth/v1/token"
  );
  // Optionally, print or log for debugging
  console.log("DYNAMIC_WP_URL set to:", process.env.DYNAMIC_WP_URL);
  console.log("DYNAMIC_JWT_AUTH_URL set to:", process.env.DYNAMIC_JWT_AUTH_URL);
  
})();
