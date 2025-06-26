const { getWpPlaygroundUrl } = require('./server');

let WP_API_URL; // Memoization variable

/**
 * Next.js supports exporting a function from next.config.js for async config.
 * This allows you to await async logic before returning the config object.
 */
module.exports = {
  publicRuntimeConfig: {
    WP_API_URL: process.env.DYNAMIC_WP_URL,
    JWT_AUTH_URL: process.env.DYNAMIC_JWT_AUTH_URL || (process.env.DYNAMIC_WP_URL ? process.env.DYNAMIC_WP_URL.replace('/wp-json', '/wp-json/jwt-auth/v1/token') : undefined),
  },
}; 