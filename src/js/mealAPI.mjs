import { setCached, getCached } from './storageUtils.mjs';

// TheMealDB — public API, no key required
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

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

export async function getCategories() {
  const data = await fetchJSON('/categories.php');
  return data.categories ?? [];
}

export async function getMealsByCategory(cat) {
  const data = await fetchJSON(`/filter.php?c=${encodeURIComponent(cat)}`);
  return data.meals ?? [];
}

export async function getMealById(id) {
  const data = await fetchJSON(`/lookup.php?i=${id}`);
  return data.meals ? data.meals[0] : null;
}

export async function searchMealsByName(name) {
  const data = await fetchJSON(`/search.php?s=${encodeURIComponent(name)}`);
  return data.meals ?? [];
}
