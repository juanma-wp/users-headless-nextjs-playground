import { getWpPlayground } from "./wp-server";

let handlerPromise;

export function getWpPlaygroundHandler() {
  if (!handlerPromise) {
    console.log("getting handler...");
    handlerPromise = getWpPlayground();
  }
  else{
    console.log("handler already exists");
  }
  return handlerPromise;
} 