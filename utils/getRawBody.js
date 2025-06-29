/**
 * Collects and returns the raw body from a Node.js IncomingMessage (request).
 */
// TODO: Add types - convert to typescript
export async function getRawBody(req){
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
} 