import { runCLI } from "@wp-playground/cli";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

// Load environment variables from .env.local
config();

// Get JWT secret key from environment variables
const jwtSecretKey = process.env.JWT_AUTH_SECRET_KEY;

if (!jwtSecretKey) {
  throw new Error('JWT_AUTH_SECRET_KEY must be defined in .env.local');
}

// Define a unique symbol for the global property to avoid naming conflicts
const HANDLER_PROMISE_SYMBOL = Symbol.for("wp_playground_handler_promise");

async function initializeWpPlayground() {
  console.log("😅 Getting WP Playground handler for the first time...");
  try {
    const blueprint = JSON.parse(
      readFileSync(resolve("./wordpress/blueprint.json"), "utf8")
    );

    // Replace the JWT_AUTH_SECRET_KEY placeholder with the actual secret key
    blueprint.steps = blueprint.steps.map(step => {
      if (step.step === 'defineWpConfigConsts' && step.consts && 'JWT_AUTH_SECRET_KEY' in step.consts) {
        return {
          ...step,
          consts: {
            ...step.consts,
            JWT_AUTH_SECRET_KEY: jwtSecretKey
          }
        };
      }
  
      return step;
    });
    
    console.log("Loaded blueprint:", JSON.stringify(blueprint, null, 2));

    const cliServer = await runCLI({
      command: "server",
      debug: true,
      login: true,
      mount: [
        {
          hostPath: resolve("./database/"),
          vfsPath: `/wordpress/wp-content/database/`,
        },
        {
          hostPath: resolve("./wordpress/plugins/extended-user-info-rest.php"),
          vfsPath: `/wordpress/wp-content/mu-plugins/extended-user-info-rest.php`,
        },
      ],
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
