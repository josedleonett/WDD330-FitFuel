/**
 * nutritionUI.mjs
 * DOM-rendering helpers for the Nutrition page.
 * Builds meal cards, the detail modal, and favourite-button state.
 * Meal IDs are prefixed with "meal_" to share the favourites store
 * with exercises without key collisions.
 */

import { isFavorite } from './storageUtils.mjs';

/**
 * Namespaces a TheMealDB ID for the shared favourites store.
 * @param {string|number} idMeal
 * @returns {string} e.g. "meal_52772"
 */
export const mealFavId = (idMeal) => `meal_${idMeal}`;

function heartSVG(filled) {
  return `<svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function buildIngredients(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const mea = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      items.push(`<li>${mea ? mea.trim() + ' ' : ''}${ing.trim()}</li>`);
    }
  }
  return items.length
    ? `<ul class="instructions-list">${items.join('')}</ul>`
    : '<p>No ingredients listed.</p>';
}

export function renderMealCard(meal) {
  const li = document.createElement('li');
  li.className = 'exercise-card';
  li.setAttribute('role', 'listitem');

  const fav = isFavorite(mealFavId(meal.idMeal));

  li.innerHTML = `
    <div class="card-gif-wrap">
      <img
        class="card-gif"
        src="${meal.strMealThumb}"
        alt="${meal.strMeal} image"
        loading="lazy"
      />
    </div>
    <div class="card-info">
      <h2 class="card-title">${meal.strMeal}</h2>
      <div class="card-badges">
        ${meal.strCategory ? `<span class="badge">${meal.strCategory}</span>` : ''}
        ${meal.strArea ? `<span class="badge badge-bodypart">${meal.strArea}</span>` : ''}
      </div>
      <div class="card-footer">
        <button class="btn-details" type="button" data-id="${meal.idMeal}">View Recipe</button>
        <button class="btn-favorite${fav ? ' btn-favorite--active' : ''}" type="button" data-id="${meal.idMeal}" aria-label="${fav ? 'Remove from favorites' : 'Save to favorites'}">${heartSVG(fav)}</button>
      </div>
    </div>
  `;
  return li;
}

export function updateMealFavoriteBtn(idMeal) {
  const fav = isFavorite(mealFavId(idMeal));
  document.querySelectorAll(`.btn-favorite[data-id="${idMeal}"]`).forEach((btn) => {
    btn.classList.toggle('btn-favorite--active', fav);
    btn.setAttribute('aria-label', fav ? 'Remove from favorites' : 'Save to favorites');
    btn.innerHTML = heartSVG(fav);
  });
}

export function renderMealModal(meal) {
  const fav = isFavorite(mealFavId(meal.idMeal));
  const youtube = meal.strYoutube
    ? `<a href="${meal.strYoutube}" target="_blank" rel="noopener noreferrer" class="btn-details" style="display:inline-block;margin-top:8px">Watch on YouTube</a>`
    : '';

  return `
    <div class="modal-gif-wrap">
      <img class="modal-gif" src="${meal.strMealThumb}" alt="${meal.strMeal} image" />
    </div>
    <div class="modal-body">
      <div class="modal-header-row">
        <h2 class="modal-title" id="modal-title">${meal.strMeal}</h2>
        <button class="btn-favorite${fav ? ' btn-favorite--active' : ''} modal-fav-btn" type="button" data-id="${meal.idMeal}" aria-label="${fav ? 'Remove from favorites' : 'Save to favorites'}">${heartSVG(fav)}</button>
      </div>
      <div class="modal-meta">
        ${meal.strCategory ? `<span class="badge">${meal.strCategory}</span>` : ''}
        ${meal.strArea ? `<span class="badge">${meal.strArea}</span>` : ''}
      </div>
      <div class="modal-section">
        <h3>Ingredients</h3>
        ${buildIngredients(meal)}
      </div>
      <div class="modal-section">
        <h3>Instructions</h3>
        <p>${meal.strInstructions ?? 'No instructions available.'}</p>
        ${youtube}
      </div>
    </div>
  `;
}

export function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

export function hideError(el) {
  el.classList.add('hidden');
  el.textContent = '';
}
