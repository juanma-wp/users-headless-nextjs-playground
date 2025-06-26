import { runCLI } from "@wp-playground/cli";
import { readFileSync } from "fs";
import { resolve } from "path";

async function getWpPlayground() {
  try {
    const blueprint = JSON.parse(
      readFileSync(resolve("./blueprint.json"), "utf8")
    );

    const cliServer = await runCLI({
      command: "server",
      blueprint,
    });

    const handler = cliServer.requestHandler;
    return handler;
  } catch (error) {
    console.error("Error starting WP Playground server:", error);
    return "http://localhost:8000"; // Fallback URL
  }
}

export { getWpPlayground };
