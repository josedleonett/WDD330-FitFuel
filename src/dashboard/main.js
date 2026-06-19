/**
 * dashboard/main.js
 * Entry point for the Dashboard page.
 * Reads meal log and workout log from localStorage to render
 * daily calorie/macro progress and recent activity lists.
 * Also manages the Log Meal modal and streak counter.
 */

import '../css/style.css';
import {
  getTheme,
  setTheme,
  getProfile,
  setProfile,
  getMealLog,
  addMealEntry,
  getWorkoutLog,
  getStreak,
} from '../js/storageUtils.mjs';

// ── DOM refs ────────────────────────────────────────────────
const themeToggle     = document.getElementById('theme-toggle');
const dashDate        = document.getElementById('dashboard-date');
const streakCount     = document.getElementById('streak-count');
const btnLogMeal      = document.getElementById('btn-log-meal');
const logMealModal    = document.getElementById('log-meal-modal');
const logMealClose    = document.getElementById('log-meal-close');
const logMealForm     = document.getElementById('log-meal-form');
const mealsList       = document.getElementById('meals-list');
const mealsEmpty      = document.getElementById('meals-empty');
const workoutsList    = document.getElementById('workouts-list');
const workoutsEmpty   = document.getElementById('workouts-empty');
const settingsBtn     = document.getElementById('settings-btn');
const settingsModal   = document.getElementById('settings-modal');
const settingsClose   = document.getElementById('settings-close');
const settingsForm    = document.getElementById('settings-form');

// ── Macro bar IDs ────────────────────────────────────────────
const MACROS = [
  { key: 'calories', unit: 'kcal', goalKey: 'calorieGoal', default: 2000 },
  { key: 'protein',  unit: 'g',    goalKey: 'proteinGoal',  default: 125 },
  { key: 'carbs',    unit: 'g',    goalKey: 'carbsGoal',    default: 200 },
  { key: 'fat',      unit: 'g',    goalKey: 'fatGoal',      default: 60  },
];

// ── Init ─────────────────────────────────────────────────────
applyTheme();
renderDate();
renderStreak();
renderMacros();
renderMeals();
renderWorkouts();

// ── Theme ────────────────────────────────────────────────────
function applyTheme() {
  const t = getTheme();
  document.documentElement.setAttribute('data-theme', t);
  themeToggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  applyTheme();
});

// ── Date ────────────────────────────────────────────────────
function renderDate() {
  const now = new Date();
  dashDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ── Streak ──────────────────────────────────────────────────
function renderStreak() {
  streakCount.textContent = getStreak();
}

// ── Macro progress ───────────────────────────────────────────
function getTodayTotals() {
  const today = new Date().toDateString();
  const log = getMealLog().filter((e) => new Date(e.ts).toDateString() === today);
  return log.reduce(
    (acc, e) => {
      acc.calories += e.calories || 0;
      acc.protein  += e.protein  || 0;
      acc.carbs    += e.carbs    || 0;
      acc.fat      += e.fat      || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function renderMacros() {
  const profile = getProfile();
  const totals  = getTodayTotals();

  MACROS.forEach(({ key, goalKey, default: def }) => {
    const goal    = profile[goalKey] ?? def;
    const current = totals[key] ?? 0;
    const pct     = Math.min(Math.round((current / goal) * 100), 100);

    const consumed = document.getElementById(`${key}-consumed`);
    const goalEl   = document.getElementById(`${key}-goal`);
    const bar      = document.getElementById(`${key}-bar`);
    const barWrap  = document.getElementById(`${key}-bar-wrap`);
    const pctEl    = document.getElementById(`${key}-pct`);

    if (consumed) consumed.textContent = current;
    if (goalEl)   goalEl.textContent   = goal.toLocaleString();
    if (bar)      bar.style.width      = `${pct}%`;
    if (barWrap)  barWrap.setAttribute('aria-valuenow', pct);
    if (pctEl)    pctEl.textContent    = `${pct}% completed`;
  });
}

// ── Meals list ───────────────────────────────────────────────
function renderMeals() {
  const today = new Date().toDateString();
  const entries = getMealLog().filter((e) => new Date(e.ts).toDateString() === today);

  mealsList.innerHTML = '';
  if (entries.length === 0) {
    mealsEmpty.classList.remove('hidden');
    return;
  }
  mealsEmpty.classList.add('hidden');

  const frag = document.createDocumentFragment();
  entries.forEach((e) => {
    const li = document.createElement('li');
    li.className = 'activity-item';
    const time = new Date(e.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    li.innerHTML = `
      <div class="activity-item__info">
        <strong>${e.name}</strong>
        <span class="activity-item__time">${time}</span>
      </div>
      <span class="activity-item__value">${e.calories} kcal</span>
    `;
    frag.appendChild(li);
  });
  mealsList.appendChild(frag);
}

// ── Workouts list ────────────────────────────────────────────
function renderWorkouts() {
  const today = new Date().toDateString();
  const log = getWorkoutLog().filter((w) => new Date(w.ts).toDateString() === today);

  workoutsList.innerHTML = '';
  if (log.length === 0) {
    workoutsEmpty.classList.remove('hidden');
    return;
  }
  workoutsEmpty.classList.add('hidden');

  const frag = document.createDocumentFragment();
  log.forEach((w) => {
    const li = document.createElement('li');
    li.className = 'activity-item';
    const time = new Date(w.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    li.innerHTML = `
      <div class="activity-item__info">
        <strong>${w.name}</strong>
        <span class="activity-item__time">${time}</span>
      </div>
      <span class="activity-item__badge activity-item__badge--done">Completed</span>
    `;
    frag.appendChild(li);
  });
  workoutsList.appendChild(frag);
}

// ── Log Meal modal ───────────────────────────────────────────
btnLogMeal.addEventListener('click', () => {
  logMealModal.showModal();
});

logMealClose.addEventListener('click', () => {
  logMealModal.close();
  logMealForm.reset();
});

logMealModal.addEventListener('click', (e) => {
  if (e.target === logMealModal) {
    logMealModal.close();
    logMealForm.reset();
  }
});

logMealForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name     = document.getElementById('meal-name').value.trim();
  const calories = Number(document.getElementById('meal-calories').value) || 0;
  const protein  = Number(document.getElementById('meal-protein').value)  || 0;
  const carbs    = Number(document.getElementById('meal-carbs').value)    || 0;
  const fat      = Number(document.getElementById('meal-fat').value)      || 0;

  if (!name || calories <= 0) return;

  addMealEntry({ name, calories, protein, carbs, fat });
  logMealModal.close();
  logMealForm.reset();
  renderMacros();
  renderMeals();
});

// ── Settings modal ───────────────────────────────────────────
function populateSettingsForm() {
  const p = getProfile();
  document.getElementById('goal-calories').value = p.calorieGoal ?? 2000;
  document.getElementById('goal-protein').value  = p.proteinGoal  ?? 125;
  document.getElementById('goal-carbs').value    = p.carbsGoal    ?? 200;
  document.getElementById('goal-fat').value      = p.fatGoal      ?? 60;
}

settingsBtn.addEventListener('click', () => {
  populateSettingsForm();
  settingsModal.showModal();
});

settingsClose.addEventListener('click', () => settingsModal.close());

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) settingsModal.close();
});

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  setProfile({
    calorieGoal: Number(document.getElementById('goal-calories').value) || 2000,
    proteinGoal: Number(document.getElementById('goal-protein').value)  || 125,
    carbsGoal:   Number(document.getElementById('goal-carbs').value)    || 200,
    fatGoal:     Number(document.getElementById('goal-fat').value)      || 60,
  });
  settingsModal.close();
  renderMacros();
});
