/**
 * apiBase — where the backend lives.
 *
 * In local dev the Vite proxy (or same-origin server.ts) serves /api, so this
 * is empty. In production (GitHub Pages frontend + Render backend), set
 * VITE_API_URL to the Render service URL, e.g.
 * https://themiso-api.onrender.com — no trailing slash.
 */
export const API_BASE: string = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? ''
).replace(/\/$/, '');

/** Prefix an /api path with the backend base URL. */
export function api(path: string): string {
  return `${API_BASE}${path}`;
}
