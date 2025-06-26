// Import required modules
import { spawn } from 'child_process';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// Helper to wait for the WP Playground server to be ready
// Polls the given URL until it returns a 200 status or times out
const waitForServer = (url, timeout = 30000) => {
  console.log(`[waitForServer] Checking URL: ${url} with timeout ${timeout}ms`);
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let cookies = [];
    // Recursive function to check the server status
    const check = (checkUrl) => {
      const { protocol } = new URL(checkUrl);
      const lib = protocol === 'https:' ? https : http;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Node.js script)', // Mimic browser UA
          'Accept': 'application/json',
          'Cookie': cookies.join('; ') // Pass cookies for session continuity
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
        if (res.statusCode === 200) resolve(); // Server is ready
        else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Handle HTTP redirects
          console.log(`[waitForServer] Redirecting to: ${res.headers.location}`);
          const nextUrl = new URL(res.headers.location, checkUrl).toString();
          check(nextUrl);
        } else if (Date.now() - start < timeout) setTimeout(() => check(checkUrl), 500); // Retry
        else reject('Server took too long to start'); // Timeout
      }).on('error', (err) => {
        // Handle connection errors
        console.log(`[waitForServer] Error connecting to ${checkUrl}:`, err.message);
        if (Date.now() - start < timeout) setTimeout(() => check(checkUrl), 500);
        else reject('Server failed to start');
      });
    };
    check(url);
  });
};

// 1. Start the WP Playground server as a child process
const serverProcess = spawn('node', ['wp-server.js'], {
  stdio: ['ignore', 'pipe', 'inherit'], // capture stdout for parsing
  env: { ...process.env },
});

let wpUrl = null; // Will hold the dynamic WP URL
let jwtUrl = null; // Will hold the JWT auth URL

// Listen for output from the WP server process
serverProcess.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str); // echo output to main process
  // Look for the WP and JWT URLs in the output
  const wpMatch = str.match(/DYNAMIC_WP_URL set to: (.+)/);
  const jwtMatch = str.match(/DYNAMIC_JWT_AUTH_URL set to: (.+)/);
  if (wpMatch) wpUrl = wpMatch[1].trim();
  if (jwtMatch) jwtUrl = jwtMatch[1].trim();
});

// If the server process exits before providing a URL, exit with error
serverProcess.on('exit', (code) => {
  if (!wpUrl) {
    console.error('WP Playground server exited before providing URL.');
    process.exit(1);
  }
});

// Wait for the WP URL to be set, with a timeout
let waited = 0;
while (!wpUrl && waited < 30000) {
  await new Promise((r) => setTimeout(r, 200));
  waited += 200;
}
if (!wpUrl) {
  console.error('Failed to get WP Playground URL from wp-server.js');
  process.exit(1);
}

// Optional: Wait a little after URL is printed to ensure server is ready
await new Promise((r) => setTimeout(r, 1000));

// Check /wp-json/ endpoint to confirm server readiness
const checkUrl = wpUrl.replace(/\/$/, '') + '/wp-json/';
console.log(`[main] Will check server readiness at: ${checkUrl}`);
try {
  await waitForServer(checkUrl);
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Set environment variables for Next.js to use the dynamic WP URLs
process.env.DYNAMIC_WP_URL = wpUrl;
process.env.DYNAMIC_JWT_AUTH_URL = jwtUrl || wpUrl.replace('/wp-json', '/wp-json/jwt-auth/v1/token');
process.env.NEXT_PUBLIC_WP_API_URL = wpUrl;

// 2. Start the Next.js app as a child process
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit', // Inherit stdio so logs show in terminal
  env: process.env,
});
// Exit this script when Next.js process exits
nextProcess.on('exit', (code) => process.exit(code)); 