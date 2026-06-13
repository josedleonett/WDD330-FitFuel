import './css/style.css';
import {
  getAllExercises,
  getExercisesByBodyPart,
  getExercisesByName,
  getExercisesByTarget,
} from './js/exerciseAPI.mjs';
import { hideError, renderCard, renderModal, showError } from './js/ui.mjs';

// â”€â”€ DOM refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const searchInput = document.getElementById('search-input');
const chipGroup   = document.getElementById('chip-group');
const list        = document.getElementById('exercise-list');
const loading     = document.getElementById('loading');
const errorMsg    = document.getElementById('error-msg');
const resultsCount = document.getElementById('results-count');
const modal       = document.getElementById('exercise-modal');
const modalContent = document.getElementById('modal-content');
const modalClose  = document.getElementById('modal-close');

// â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let activeChip    = '';        // '' = All, otherwise bodyPart value
let debounceTimer = null;
let allExercises  = [];        // cached full list

// â”€â”€ Chip filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
chipGroup.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
  chip.classList.add('chip--active');
  activeChip = chip.dataset.value;

  searchInput.value = '';
  fetchAndRender();
});

// â”€â”€ Search input (debounced) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    // Reset chip to "All" when typing
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
    document.querySelector('.chip[data-value=""]').classList.add('chip--active');
    activeChip = '';
    fetchAndRender();
  }, 400);
});

// â”€â”€ Fetch + render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchAndRender() {
  const query = searchInput.value.trim();

  loading.classList.remove('hidden');
  list.innerHTML = '';
  resultsCount.classList.add('hidden');
  hideError(errorMsg);

  try {
    let exercises;

    if (query) {
      exercises = await getExercisesByName(query);
    } else if (activeChip) {
      exercises = await getExercisesByBodyPart(activeChip);
    } else {
      if (!allExercises.length) {
        allExercises = await getAllExercises(80);
      }
      exercises = allExercises;
    }

    renderExercises(exercises);
  } catch (err) {
    showError(errorMsg, `Could not load exercises: ${err.message}`);
  } finally {
    loading.classList.add('hidden');
  }
}

function renderExercises(exercises) {
  list.innerHTML = '';

  if (!exercises.length) {
    showError(errorMsg, 'No exercises found. Try a different search or filter.');
    return;
  }

  resultsCount.textContent = `Results (${exercises.length} exercise${exercises.length !== 1 ? 's' : ''})`;
  resultsCount.classList.remove('hidden');

  const fragment = document.createDocumentFragment();
  exercises.forEach((ex) => {
    const card = renderCard(ex);
    // "View Details" button opens modal
    card.querySelector('.btn-details').addEventListener('click', () => openModal(ex));
    fragment.appendChild(card);
  });
  list.appendChild(fragment);
}

// â”€â”€ Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openModal(exercise) {
  modalContent.innerHTML = renderModal(exercise);
  modal.showModal();
}

modalClose.addEventListener('click', () => modal.close());
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

// â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
fetchAndRender();


