import { setCached, getCached } from './storageUtils.mjs';

const BASE_URL = 'https://exercisedb.p.rapidapi.com';

const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY ?? '';

const HEADERS = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
};

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

export async function getBodyPartList() {
  return fetchJSON('/exercises/bodyPartList');
}

export async function getTargetList() {
  return fetchJSON('/exercises/targetList');
}

export async function getAllExercises(limit = 80) {
  return fetchJSON(`/exercises?limit=${limit}&offset=0`);
}

export async function getExercisesByBodyPart(bodyPart, limit = 60) {
  return fetchJSON(`/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=0`);
}

export async function getExercisesByTarget(target, limit = 60) {
  return fetchJSON(`/exercises/target/${encodeURIComponent(target)}?limit=${limit}&offset=0`);
}

export async function getExercisesByName(name, limit = 60) {
  return fetchJSON(`/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=${limit}&offset=0`);
}
