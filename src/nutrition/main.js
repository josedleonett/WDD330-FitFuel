/**
 * nutrition/main.js
 * Entry point for the Nutrition page.
 * Mirrors the Exercises page logic but fetches data from TheMealDB.
 * Events covered: category chip selection, live meal search with debounce,
 * meal detail modal, meal favourites, dark mode, and recent-searches dropdown.
 */

import '../css/style.css';
import { getCategories, getMealsByCategory, getMealById, searchMealsByName } from '../js/mealAPI.mjs';
import {
  getFavorites,
  toggleFavorite,
  getTheme,
  setTheme,
  getItem,
  setItem,
  addMealEntry,
} from '../js/storageUtils.mjs';
import {
  renderMealCard,
  updateMealFavoriteBtn,
  renderMealModal,
  showError,
  hideError,
  mealFavId,
} from '../js/nutritionUI.mjs';

const searchInput  = document.getElementById('search-input');
const chipGroup    = document.getElementById('chip-group');
const list         = document.getElementById('exercise-list');
const loading      = document.getElementById('loading');
const errorMsg     = document.getElementById('error-msg');
const resultsCount = document.getElementById('results-count');
const modal        = document.getElementById('exercise-modal');
const modalContent = document.getElementById('modal-content');
const modalClose   = document.getElementById('modal-close');
const themeToggle  = document.getElementById('theme-toggle');
const recentList   = document.getElementById('recent-searches');

const LAST_FILTER_KEY   = 'fitfuel_last_meal_filter';
const RECENT_SEARCH_KEY = 'fitfuel_recent_meal_searches';

let activeChip    = '';
let debounceTimer = null;
const mealMap     = new Map();

function normalizeMealForStorage(meal) {
  return {
    id: mealFavId(meal.idMeal),
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb,
    strCategory: meal.strCategory ?? '',
    strArea: meal.strArea ?? '',
  };
}

function getMealFavorites() {
  return getFavorites()
    .filter((f) => String(f.id).startsWith('meal_'))
    .map((f) => ({
      idMeal: f.idMeal,
      strMeal: f.strMeal,
      strMealThumb: f.strMealThumb,
      strCategory: f.strCategory,
      strArea: f.strArea,
    }));
}

function getRecentMealSearches() {
  return getItem(RECENT_SEARCH_KEY) ?? [];
}

function addRecentMealSearch(term) {
  const searches = getRecentMealSearches().filter((s) => s !== term);
  searches.unshift(term);
  setItem(RECENT_SEARCH_KEY, searches.slice(0, 5));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function renderRecentMealSearches() {
  const searches = getRecentMealSearches();
  if (!searches.length) {
    recentList.classList.add('hidden');
    return;
  }
  recentList.innerHTML = searches
    .map((s) => `<button class="recent-item" type="button">${s}</button>`)
    .join('');
  recentList.classList.remove('hidden');
}

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(next);
  applyTheme(next);
});

chipGroup.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
  chip.classList.add('chip--active');
  activeChip = chip.dataset.value;
  setItem(LAST_FILTER_KEY, activeChip);
  searchInput.value = '';
  fetchAndRender();
});

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
    const allChip = chipGroup.querySelector('.chip[data-value=""]');
    if (allChip) allChip.classList.add('chip--active');
    activeChip = '';
    fetchAndRender();
  }, 400);
});

searchInput.addEventListener('focus', () => {
  renderRecentMealSearches();
});

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !recentList.contains(e.target)) {
    recentList.classList.add('hidden');
  }
});

list.addEventListener('click', (e) => {
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) {
    const meal = mealMap.get(favBtn.dataset.id);
    if (meal) {
      toggleFavorite(normalizeMealForStorage(meal));
      updateMealFavoriteBtn(meal.idMeal);
      if (activeChip === '__favorites__') fetchAndRender();
    }
    return;
  }
  const detailBtn = e.target.closest('.btn-details');
  if (detailBtn) {
    const meal = mealMap.get(detailBtn.dataset.id);
    if (meal) openModal(meal);
  }
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) {
    const meal = mealMap.get(favBtn.dataset.id);
    if (meal) {
      toggleFavorite(normalizeMealForStorage(meal));
      updateMealFavoriteBtn(meal.idMeal);
    }
  }
  const logBtn = e.target.closest('[data-meal-id]');
  if (logBtn && logBtn.classList.contains('btn-log-workout')) {
    addMealEntry({ name: logBtn.dataset.mealName, calories: 0, protein: 0, carbs: 0, fat: 0 });
    logBtn.textContent = '\u2705 Logged!';
    logBtn.disabled = true;
  }
});

modalClose.addEventListener('click', () => modal.close());

recentList.addEventListener('click', (e) => {
  const item = e.target.closest('.recent-item');
  if (!item) return;
  searchInput.value = item.textContent;
  recentList.classList.add('hidden');
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
  const allChip = chipGroup.querySelector('.chip[data-value=""]');
  if (allChip) allChip.classList.add('chip--active');
  activeChip = '';
  clearTimeout(debounceTimer);
  fetchAndRender();
});

async function fetchAndRender() {
  const query = searchInput.value.trim();
  loading.classList.remove('hidden');
  list.innerHTML = '';
  resultsCount.classList.add('hidden');
  hideError(errorMsg);
  recentList.classList.add('hidden');

  try {
    let meals;
    if (activeChip === '__favorites__') {
      meals = getMealFavorites();
    } else if (query) {
      addRecentMealSearch(query);
      meals = await searchMealsByName(query);
    } else if (activeChip) {
      meals = await getMealsByCategory(activeChip);
    } else {
      meals = await getMealsByCategory('Chicken');
    }
    meals.forEach((m) => mealMap.set(m.idMeal, m));
    renderMeals(meals);
  } catch (err) {
    showError(errorMsg, `Could not load meals: ${err.message}`);
  } finally {
    loading.classList.add('hidden');
  }
}

function renderMeals(meals) {
  list.innerHTML = '';
  if (!meals || !meals.length) {
    showError(errorMsg, 'No meals found. Try a different search or filter.');
    return;
  }
  resultsCount.textContent = `${meals.length} meal${meals.length !== 1 ? 's' : ''}`;
  resultsCount.classList.remove('hidden');
  const fragment = document.createDocumentFragment();
  meals.forEach((m) => fragment.appendChild(renderMealCard(m)));
  list.appendChild(fragment);
}

async function openModal(meal) {
  try {
    const full = await getMealById(meal.idMeal);
    if (full) {
      mealMap.set(full.idMeal, full);
      modalContent.innerHTML = renderMealModal(full);
    } else {
      modalContent.innerHTML = renderMealModal(meal);
    }
  } catch {
    modalContent.innerHTML = renderMealModal(meal);
  }
  modal.showModal();
}

async function buildChips() {
  const categories = await getCategories().catch(() => null);
  if (!categories) return;

  const allBtn = chipGroup.querySelector('.chip[data-value=""]');
  const favBtn = chipGroup.querySelector('.chip[data-value="__favorites__"]');
  chipGroup.innerHTML = '';
  if (allBtn) chipGroup.appendChild(allBtn);
  if (favBtn) chipGroup.appendChild(favBtn);

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.dataset.value = cat.strCategory;
    btn.textContent = cat.strCategory;
    chipGroup.appendChild(btn);
  });

  const saved = getItem(LAST_FILTER_KEY);
  if (saved) {
    const target = chipGroup.querySelector(`.chip[data-value="${saved}"]`);
    if (target) {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
      target.classList.add('chip--active');
      activeChip = saved;
    }
  }
}

async function init() {
  applyTheme(getTheme());
  await buildChips();
  await fetchAndRender();
}

init();
