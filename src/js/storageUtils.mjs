/**
 * storageUtils.mjs
 * Centralised localStorage helpers for FitFuel.
 * All data is JSON-serialised on write and deserialised on read.
 * Cache entries include a timestamp and are invalidated after CACHE_TTL.
 */

/** Cache time-to-live: 24 hours in milliseconds. */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Serialises a value to JSON and writes it to localStorage.
 * @param {string} key
 * @param {*} value
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode or storage full) — fail silently
  }
}

/**
 * Reads and deserialises a value from localStorage.
 * @param {string} key
 * @returns {*|null}
 */
export function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Removes a key from localStorage.
 * @param {string} key
 */
export function removeItem(key) {
  localStorage.removeItem(key);
}

/**
 * Stores API response data with a creation timestamp for TTL validation.
 * @param {string} key
 * @param {*} data
 */
export function setCached(key, data) {
  setItem(key, { data, ts: Date.now() });
}

/**
 * Returns cached API data if present and not expired, otherwise null.
 * @param {string} key
 * @returns {*|null}
 */
export function getCached(key) {
  const entry = getItem(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    removeItem(key);
    return null;
  }
  return entry.data;
}

/** Returns the saved array of favourite exercises. */
export function getFavorites() {
  return getItem('fitfuel_favorites') ?? [];
}

/**
 * Persists the favourites array.
 * @param {Array} favorites
 */
export function setFavorites(favorites) {
  setItem('fitfuel_favorites', favorites);
}

/**
 * Returns true if an exercise or meal with the given id is in favourites.
 * @param {string} id
 * @returns {boolean}
 */
export function isFavorite(id) {
  return getFavorites().some((f) => f.id === id);
}

/**
 * Adds or removes an item from favourites and persists the change.
 * @param {{ id: string }} exercise - Object with at least an `id` property.
 * @returns {boolean} true if the item was added, false if removed.
 */
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

/** Returns the saved UI theme ('light' or 'dark'). */
export function getTheme() {
  return getItem('fitfuel_theme') ?? 'light';
}

/**
 * Persists the theme and applies it to the document root.
 * @param {'light'|'dark'} theme
 */
export function setTheme(theme) {
  setItem('fitfuel_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

/** Returns the last active body-part filter chip value. */
export function getLastFilter() {
  return getItem('fitfuel_last_filter') ?? '';
}

/**
 * Persists the active filter chip value.
 * @param {string} filter
 */
export function setLastFilter(filter) {
  setItem('fitfuel_last_filter', filter);
}

/** Returns the array of the last 5 exercise search terms. */
export function getRecentSearches() {
  return getItem('fitfuel_recent_searches') ?? [];
}

/**
 * Prepends a search term to the recent searches list (max 5 entries).
 * @param {string} term
 */
export function addRecentSearch(term) {
  if (!term || term.length < 2) return;
  const list = getRecentSearches().filter((s) => s !== term);
  list.unshift(term);
  setItem('fitfuel_recent_searches', list.slice(0, 5));
}
