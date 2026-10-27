import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // The app is entirely client-side, so it is exported as static files and
  // served straight from a CDN — no Node server needed for the frontend.
  output: 'export',
  // The repo root also has a lockfile; pin Turbopack to this app.
  turbopack: { root: projectDir },
};

export default nextConfig;
