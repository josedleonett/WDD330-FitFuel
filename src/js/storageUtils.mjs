// Cache TTL: 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('localStorage write failed:', key);
  }
}

export function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removeItem(key) {
  localStorage.removeItem(key);
}

export function setCached(key, data) {
  setItem(key, { data, ts: Date.now() });
}

export function getCached(key) {
  const entry = getItem(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    removeItem(key);
    return null;
  }
  return entry.data;
}
