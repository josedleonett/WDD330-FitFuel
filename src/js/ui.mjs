/**
 * ui.mjs
 * DOM-rendering helpers for the Exercises page.
 * Builds exercise cards, the detail modal, and favourite-button state.
 */

import { isFavorite } from './storageUtils.mjs';

const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY ?? '';

/**
 * Returns the GIF URL for an exercise from ExerciseDB.
 * @param {string} id - ExerciseDB exercise ID.
 */
const gifUrl = (id) =>
  `https://exercisedb.p.rapidapi.com/image?exerciseId=${id}&resolution=180&rapidapi-key=${API_KEY}`;

function heartSVG(filled) {
  return `<svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

export function renderCard(exercise) {
  const li = document.createElement('li');
  li.className = 'exercise-card';
  li.setAttribute('role', 'listitem');

  const secondary =
    Array.isArray(exercise.secondaryMuscles) && exercise.secondaryMuscles.length
      ? exercise.secondaryMuscles.slice(0, 2).join(', ')
      : 'None';

  const fav = isFavorite(exercise.id);

  li.innerHTML = `
    <div class="card-gif-wrap">
      <img
        class="card-gif"
        src="${gifUrl(exercise.id)}"
        alt="${exercise.name} demonstration"
        loading="lazy"
      />
    </div>
    <div class="card-info">
      <h2 class="card-title">${exercise.name}</h2>
      <p class="card-muscle-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>
        Primary: <strong>${exercise.target}</strong>
      </p>
      <p class="card-muscle-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-dasharray="2 4"/></svg>
        Secondary: <strong>${secondary}</strong>
      </p>
      <div class="card-badges">
        <span class="badge">${exercise.equipment}</span>
        <span class="badge badge-bodypart">${exercise.bodyPart}</span>
      </div>
      <div class="card-footer">
        <button class="btn-details" type="button" data-id="${exercise.id}">View Details</button>
        <button class="btn-favorite${fav ? ' btn-favorite--active' : ''}" type="button" data-id="${exercise.id}" aria-label="${fav ? 'Remove from favorites' : 'Save to favorites'}">${heartSVG(fav)}</button>
      </div>
    </div>
  `;

  return li;
}

export function updateFavoriteBtn(id) {
  const fav = isFavorite(id);
  document.querySelectorAll(`.btn-favorite[data-id="${id}"]`).forEach((btn) => {
    btn.classList.toggle('btn-favorite--active', fav);
    btn.setAttribute('aria-label', fav ? 'Remove from favorites' : 'Save to favorites');
    btn.innerHTML = heartSVG(fav);
  });
}

export function renderModal(exercise) {
  const fav = isFavorite(exercise.id);

  const instructions =
    Array.isArray(exercise.instructions) && exercise.instructions.length
      ? `<ol class="instructions-list">${exercise.instructions.map((s) => `<li>${s}</li>`).join('')}</ol>`
      : '<p>No instructions available.</p>';

  const secondary =
    Array.isArray(exercise.secondaryMuscles) && exercise.secondaryMuscles.length
      ? exercise.secondaryMuscles.map((m) => `<span class="badge">${m}</span>`).join('')
      : '<span class="badge">None listed</span>';

  return `
    <div class="modal-gif-wrap">
      <img class="modal-gif" src="${gifUrl(exercise.id)}" alt="${exercise.name} demonstration" />
    </div>
    <div class="modal-body">
      <div class="modal-header-row">
        <h2 class="modal-title" id="modal-title">${exercise.name}</h2>
        <button class="btn-favorite${fav ? ' btn-favorite--active' : ''} modal-fav-btn" type="button" data-id="${exercise.id}" aria-label="${fav ? 'Remove from favorites' : 'Save to favorites'}">${heartSVG(fav)}</button>
      </div>
      <div class="modal-meta">
        <span class="badge">Target: ${exercise.target}</span>
        <span class="badge">${exercise.bodyPart}</span>
        <span class="badge">${exercise.equipment}</span>
      </div>
      <div class="modal-section">
        <h3>Secondary Muscles</h3>
        <div class="card-badges">${secondary}</div>
      </div>
      <div class="modal-section">
        <h3>Instructions</h3>
        ${instructions}
      </div>
      <div class="modal-section modal-actions">
        <button class="btn-log-workout" type="button" data-id="${exercise.id}" data-name="${exercise.name}">
          ✅ Mark as Done
        </button>
      </div>
    </div>
  `;
}

export function showError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

export function hideError(el) {
  el.classList.add('hidden');
  el.textContent = '';
}
