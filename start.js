import { spawn } from 'child_process';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// Helper to wait for the WP Playground server to be ready
const waitForServer = (url, timeout = 30000) => {
  console.log(`[waitForServer] Checking URL: ${url} with timeout ${timeout}ms`);
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let cookies = [];
    const check = (checkUrl) => {
      const { protocol } = new URL(checkUrl);
      const lib = protocol === 'https:' ? https : http;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Node.js script)',
          'Accept': 'application/json',
          'Cookie': cookies.join('; ')
        }
      };
      lib.get(checkUrl, options, (res) => {
        // Collect cookies from set-cookie headers
        if (res.headers['set-cookie']) {
          cookies = cookies.concat(
            res.headers['set-cookie'].map(c => c.split(';')[0])
          );
        }
        console.log(`[waitForServer] Got status code: ${res.statusCode} from ${checkUrl}`);
        if (res.statusCode === 200) resolve();
        else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`[waitForServer] Redirecting to: ${res.headers.location}`);
          // Follow redirect
          const nextUrl = new URL(res.headers.location, checkUrl).toString();
          check(nextUrl);
        } else if (Date.now() - start < timeout) setTimeout(() => check(checkUrl), 500);
        else reject('Server took too long to start');
      }).on('error', (err) => {
        console.log(`[waitForServer] Error connecting to ${checkUrl}:`, err.message);
        if (Date.now() - start < timeout) setTimeout(() => check(checkUrl), 500);
        else reject('Server failed to start');
      });
    };
    check(url);
  });
};

// 1. Start the WP Playground server
const serverProcess = spawn('node', ['wp-server.js'], {
  stdio: ['ignore', 'pipe', 'inherit'], // capture stdout
  env: { ...process.env },
});

let wpUrl = null;
let jwtUrl = null;

serverProcess.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str); // echo output
  // Look for the URL in the output
  const wpMatch = str.match(/DYNAMIC_WP_URL set to: (.+)/);
  const jwtMatch = str.match(/DYNAMIC_JWT_AUTH_URL set to: (.+)/);
  if (wpMatch) wpUrl = wpMatch[1].trim();
  if (jwtMatch) jwtUrl = jwtMatch[1].trim();
});

serverProcess.on('exit', (code) => {
  if (!wpUrl) {
    console.error('WP Playground server exited before providing URL.');
    process.exit(1);
  }
});

// Top-level await is allowed in ES modules
let waited = 0;
while (!wpUrl && waited < 30000) {
  await new Promise((r) => setTimeout(r, 200));
  waited += 200;
}
if (!wpUrl) {
  console.error('Failed to get WP Playground URL from wp-server.js');
  process.exit(1);
}

// Optional: Wait a little after URL is printed
await new Promise((r) => setTimeout(r, 1000));

// Check /wp-json/ endpoint
const checkUrl = wpUrl.replace(/\/$/, '') + '/wp-json/';
console.log(`[main] Will check server readiness at: ${checkUrl}`);
try {
  await waitForServer(checkUrl);
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Set env vars for Next.js
process.env.DYNAMIC_WP_URL = wpUrl;
process.env.DYNAMIC_JWT_AUTH_URL = jwtUrl || wpUrl.replace('/wp-json', '/wp-json/jwt-auth/v1/token');
process.env.NEXT_PUBLIC_WP_API_URL = wpUrl;

// 2. Start Next.js app
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: process.env,
});
nextProcess.on('exit', (code) => process.exit(code)); 