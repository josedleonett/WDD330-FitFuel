/**
 * mealAPI.mjs
 * Fetch helpers for TheMealDB public API.
 * No API key required. All responses are cached in localStorage with a 24-hour TTL.
 * Base URL: https://www.themealdb.com/api/json/v1/1
 */

import { setCached, getCached } from './storageUtils.mjs';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

/**
 * Fetches JSON from a TheMealDB endpoint, serving from cache when available.
 * @param {string} path - API path with query string.
 * @returns {Promise<*>}
 */
async function fetchJSON(path) {
  const cacheKey = `fitfuel_cache_meal_${path}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`MealDB API error ${res.status}: ${res.statusText}`);

  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/** Returns the full list of meal categories. */
export async function getCategories() {
  const data = await fetchJSON('/categories.php');
  return data.categories ?? [];
}

/**
 * Returns meals that belong to the given category.
 * Note: list responses contain only idMeal, strMeal, and strMealThumb.
 * Use getMealById for full details.
 * @param {string} cat - Category name.
 */
export async function getMealsByCategory(cat) {
  const data = await fetchJSON(`/filter.php?c=${encodeURIComponent(cat)}`);
  return data.meals ?? [];
}

/**
 * Returns the full meal object for the given TheMealDB ID.
 * @param {string|number} id
 * @returns {Promise<Object|null>}
 */
export async function getMealById(id) {
  const data = await fetchJSON(`/lookup.php?i=${id}`);
  return data.meals ? data.meals[0] : null;
}

/**
 * Returns meals whose name contains the search term.
 * @param {string} name
 * @returns {Promise<Array>}
 */
export async function searchMealsByName(name) {
  const data = await fetchJSON(`/search.php?s=${encodeURIComponent(name)}`);
  return data.meals ?? [];
}
