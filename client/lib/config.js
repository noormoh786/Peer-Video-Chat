// Must match PORT in the signaling server (index.js).
// 5001 by default because macOS AirPlay Receiver occupies 5000.
const SIGNALING_PORT = process.env.NEXT_PUBLIC_SIGNALING_PORT || 5001;

/**
 * Resolves the signaling server URL.
 * - Uses NEXT_PUBLIC_SERVER_URL when provided.
 * - Otherwise talks to the same host the page was served from on port 5000,
 *   so opening the app from a phone over LAN (http://192.168.x.x:3000) just works.
 */
export function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_SERVER_URL) return process.env.NEXT_PUBLIC_SERVER_URL;
  if (typeof window === 'undefined') return `http://localhost:${SIGNALING_PORT}`;
  return `${window.location.protocol}//${window.location.hostname}:${SIGNALING_PORT}`;
}
