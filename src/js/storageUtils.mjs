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

export function getFavorites() {
  return getItem('fitfuel_favorites') ?? [];
}

export function setFavorites(favorites) {
  setItem('fitfuel_favorites', favorites);
}

export function isFavorite(id) {
  return getFavorites().some((f) => f.id === id);
}

export function toggleFavorite(exercise) {
  const favorites = getFavorites();
  const idx = favorites.findIndex((f) => f.id === exercise.id);
  if (idx === -1) {
    favorites.push(exercise);
  } else {
    favorites.splice(idx, 1);
  }
  setFavorites(favorites);
  return idx === -1;
}

export function getTheme() {
  return getItem('fitfuel_theme') ?? 'light';
}

export function setTheme(theme) {
  setItem('fitfuel_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function getLastFilter() {
  return getItem('fitfuel_last_filter') ?? '';
}

export function setLastFilter(filter) {
  setItem('fitfuel_last_filter', filter);
}

export function getRecentSearches() {
  return getItem('fitfuel_recent_searches') ?? [];
}

export function addRecentSearch(term) {
  if (!term || term.length < 2) return;
  const list = getRecentSearches().filter((s) => s !== term);
  list.unshift(term);
  setItem('fitfuel_recent_searches', list.slice(0, 5));
}
