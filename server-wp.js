import { runCLI } from "@wp-playground/cli";
import { readFileSync } from "fs";
import { resolve } from "path";

// Define a unique symbol for the global property to avoid naming conflicts
const HANDLER_PROMISE_SYMBOL = Symbol.for("wp_playground_handler_promise");

async function initializeWpPlayground() {
  console.log("😅 Getting WP Playground handler for the first time...");
  try {
    const blueprint = JSON.parse(
      readFileSync(resolve("./blueprint.json"), "utf8")
    );
    console.log("Loaded blueprint:", JSON.stringify(blueprint, null, 2));

    const cliServer = await runCLI({
      command: "server",
      blueprint,
    });

    return cliServer.requestHandler;
  } catch (error) {
    console.error("Error starting WP Playground server:", error);
    throw error;
  }
}

function getSingletonHandlerPromise() {
  if (!globalThis[HANDLER_PROMISE_SYMBOL]) {
    console.log("🚀 Initializing WP Playground handler...");
    globalThis[HANDLER_PROMISE_SYMBOL] = initializeWpPlayground();
  } else {
    console.log("✅ Using existing WP Playground handler promise.");
  }
  return globalThis[HANDLER_PROMISE_SYMBOL];
}

export const handlerPromise = getSingletonHandlerPromise();
