import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // The repo root also has a lockfile; pin Turbopack to this app.
  turbopack: { root: projectDir },
};

export default nextConfig;
