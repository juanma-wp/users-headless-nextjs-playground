# Next.js + Headless WordPress Playground

This project is a modern, full-stack authentication playground using Next.js and a headless WordPress instance running entirely in Node.js via [WordPress Playground](https://github.com/WordPress/wordpress-playground). It demonstrates how to:

- Run WordPress (PHP) in a Node.js environment, with no external PHP server required.
- Authenticate users via the WordPress REST API and JWT.
- Use Next.js API routes to proxy authentication and user profile requests.
- Provide a styled login form and a protected dashboard UI, using Radix UI and shadcn/ui components.

## Key Features
- **No PHP server required:** WordPress runs in-process using Playground.
- **JWT authentication:** Secure login and session management.
- **Next.js + React UI:** Modern, component-based frontend.
- **Demo credentials:** Username: `admin`, Password: `password` (for local testing).

See diagram: https://excalidraw.com/#json=uLJcu2fd3BhWgoMmcZWIi,ytn8Nz7DpPrWiIqfsDOSww

---

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd users-headless-nextjs-playground
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env.local` file in the project root:**
   ```env
   JWT_AUTH_SECRET_KEY=your_super_secret_key
   ```
   - This key is required for JWT authentication in the embedded WordPress instance.
   - You can use any strong random string.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   - The app will be available at [http://localhost:3000](http://localhost:3000).

5. **Login with demo credentials:**
   - Username: `admin`
   - Password: `password`

---

## How it works

- The custom server (`server-next.js`) launches both Next.js and a WordPress Playground instance.
- API routes (`/api/login`, `/api/profile`, `/api/logout`) handle authentication and user data, proxying requests to the in-memory WordPress.
- The login page provides a styled form; the dashboard is protected and displays user info from WordPress.
- At `/wp` we have access to the WP installation so we can do requests to the WP REST API to `/wp/wp-json/wp/v2`