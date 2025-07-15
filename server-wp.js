import { getPlaygroundHandler } from "wordpress-playground-handler";
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

export async function createPlaygroundHandler() {
  console.log("🚀 Initializing WP Playground handler...");
  try {
    const blueprintPath = resolve("./wordpress/blueprint.json");
    const blueprint = JSON.parse(readFileSync(blueprintPath, "utf8"));

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

    const handler = await getPlaygroundHandler({
      blueprintPath,
      mountPaths: {
        muPluginsPath: resolve("./wordpress/mu-plugins/")
      },
      blueprint
    });

    return handler;
  } catch (error) {
    console.error("Error starting WP Playground server:", error);
    throw error;
  }
}
