export function getResolvedApiBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
}

/**
 * True when the configured API hostname is this machine (typical local Node + Ollama setup).
 * Production deploys should set VITE_API_URL to your hosted API so this is false for end users.
 */
export function isLocalDevApiTarget() {
  const raw = getResolvedApiBaseUrl().trim();
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(raw.startsWith('http') ? raw : raw, base);
    const h = u.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.localhost');
  } catch {
    return false;
  }
}

/**
 * Poll /health and show local-backend UI only in dev or when the build is explicitly pointed at a local API.
 * Typical production (remote VITE_API_URL): no polling, no navbar chip, no "backend started" toast.
 */
export function shouldPollLocalBackendHealth() {
  return import.meta.env.DEV || isLocalDevApiTarget();
}
