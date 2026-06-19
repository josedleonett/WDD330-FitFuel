/**
 * exerciseAPI.mjs
 * Fetch helpers for the ExerciseDB API (via RapidAPI).
 * All responses are cached in localStorage with a 24-hour TTL.
 * API key is read from the VITE_RAPIDAPI_KEY environment variable.
 */

import { setCached, getCached } from './storageUtils.mjs';

const BASE_URL = 'https://exercisedb.p.rapidapi.com';

const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY ?? '';

/** RapidAPI authentication headers required on every request. */
const HEADERS = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
};

/**
 * Fetches JSON from an ExerciseDB endpoint, serving from cache when available.
 * @param {string} path - API path including query string.
 * @returns {Promise<*>}
 */
async function fetchJSON(path) {
  const cacheKey = `fitfuel_cache_${path}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/** Returns the list of available body parts. */
export async function getBodyPartList() {
  return fetchJSON('/exercises/bodyPartList');
}

/** Returns the list of available muscle targets. */
export async function getTargetList() {
  return fetchJSON('/exercises/targetList');
}

/**
 * Returns a paginated list of all exercises.
 * @param {number} [limit=80]
 */
export async function getAllExercises(limit = 80) {
  return fetchJSON(`/exercises?limit=${limit}&offset=0`);
}

/**
 * Returns exercises filtered by body part.
 * @param {string} bodyPart
 * @param {number} [limit=60]
 */
export async function getExercisesByBodyPart(bodyPart, limit = 60) {
  return fetchJSON(`/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=0`);
}

/**
 * Returns exercises filtered by target muscle.
 * @param {string} target
 * @param {number} [limit=60]
 */
export async function getExercisesByTarget(target, limit = 60) {
  return fetchJSON(`/exercises/target/${encodeURIComponent(target)}?limit=${limit}&offset=0`);
}

/**
 * Returns exercises whose name contains the search term.
 * @param {string} name
 * @param {number} [limit=60]
 */
export async function getExercisesByName(name, limit = 60) {
  return fetchJSON(`/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=${limit}&offset=0`);
}
