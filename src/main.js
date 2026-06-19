/**
 * main.js
 * Entry point for the Exercises page.
 * Wires up all events: body-part filter chips, live search with debounce,
 * infinite-scroll card list, exercise detail modal, favourites, dark mode,
 * and recent-searches dropdown.
 */

import './css/style.css';
import {
  getAllExercises,
  getBodyPartList,
  getExercisesByBodyPart,
  getExercisesByName,
} from './js/exerciseAPI.mjs';
import {
  getFavorites,
  toggleFavorite,
  getTheme,
  setTheme,
  getLastFilter,
  setLastFilter,
  getRecentSearches,
  addRecentSearch,
  addWorkoutEntry,
} from './js/storageUtils.mjs';
import { hideError, renderCard, renderModal, showError, updateFavoriteBtn } from './js/ui.mjs';

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

let activeChip    = '';
let debounceTimer = null;
let allExercises  = [];
const exerciseMap = new Map();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
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
  setLastFilter(activeChip);
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
  renderRecentSearches();
});

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !recentList.contains(e.target)) {
    recentList.classList.add('hidden');
  }
});

list.addEventListener('click', (e) => {
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) {
    const exercise = exerciseMap.get(favBtn.dataset.id);
    if (exercise) {
      toggleFavorite(exercise);
      updateFavoriteBtn(exercise.id);
      if (activeChip === '__favorites__') fetchAndRender();
    }
    return;
  }
  const detailBtn = e.target.closest('.btn-details');
  if (detailBtn) {
    const exercise = exerciseMap.get(detailBtn.dataset.id);
    if (exercise) openModal(exercise);
  }
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) {
    const exercise = exerciseMap.get(favBtn.dataset.id);
    if (exercise) {
      toggleFavorite(exercise);
      updateFavoriteBtn(exercise.id);
    }
  }
  const doneBtn = e.target.closest('.btn-log-workout');
  if (doneBtn) {
    addWorkoutEntry({ name: doneBtn.dataset.name });
    doneBtn.textContent = '✅ Logged!';
    doneBtn.disabled = true;
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
    let exercises;
    if (activeChip === '__favorites__') {
      exercises = getFavorites();
    } else if (query) {
      addRecentSearch(query);
      exercises = await getExercisesByName(query);
    } else if (activeChip) {
      exercises = await getExercisesByBodyPart(activeChip);
    } else {
      if (!allExercises.length) {
        allExercises = await getAllExercises(80);
      }
      exercises = allExercises;
    }
    exercises.forEach((ex) => exerciseMap.set(ex.id, ex));
    renderExercises(exercises);
  } catch (err) {
    showError(errorMsg, `Could not load exercises: ${err.message}`);
  } finally {
    loading.classList.add('hidden');
  }
}

function renderExercises(exercises) {
  list.innerHTML = '';
  if (!exercises || !exercises.length) {
    showError(errorMsg, 'No exercises found. Try a different search or filter.');
    return;
  }
  resultsCount.textContent = `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`;
  resultsCount.classList.remove('hidden');
  const fragment = document.createDocumentFragment();
  exercises.forEach((ex) => fragment.appendChild(renderCard(ex)));
  list.appendChild(fragment);
}

function openModal(exercise) {
  modalContent.innerHTML = renderModal(exercise);
  modal.showModal();
}

function renderRecentSearches() {
  const searches = getRecentSearches();
  if (!searches.length) {
    recentList.classList.add('hidden');
    return;
  }
  recentList.innerHTML = searches
    .map((s) => `<button class="recent-item" type="button">${s}</button>`)
    .join('');
  recentList.classList.remove('hidden');
}

async function buildChips() {
  const bodyParts = await getBodyPartList().catch(() => null);
  if (!bodyParts) return;

  const allBtn = chipGroup.querySelector('.chip[data-value=""]');
  const favBtn = chipGroup.querySelector('.chip[data-value="__favorites__"]');
  chipGroup.innerHTML = '';
  if (allBtn) chipGroup.appendChild(allBtn);
  if (favBtn) chipGroup.appendChild(favBtn);

  bodyParts.forEach((bp) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.dataset.value = bp;
    btn.textContent = bp.charAt(0).toUpperCase() + bp.slice(1);
    chipGroup.appendChild(btn);
  });

  const saved = getLastFilter();
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
