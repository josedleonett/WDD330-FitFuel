const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY ?? '';
const gifUrl = (id) => `https://exercisedb.p.rapidapi.com/image?exerciseId=${id}&resolution=180&rapidapi-key=${API_KEY}`;

export function renderCard(exercise) {
  const li = document.createElement('li');
  li.className = 'exercise-card';
  li.setAttribute('role', 'listitem');

  const secondary =
    Array.isArray(exercise.secondaryMuscles) && exercise.secondaryMuscles.length
      ? exercise.secondaryMuscles.slice(0, 2).join(', ')
      : 'None';

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
        Primary Muscle: <strong>${exercise.target}</strong>
      </p>
      <p class="card-muscle-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-dasharray="2 4"/></svg>
        Secondary Muscles: <strong>${secondary}</strong>
      </p>
      <div class="card-badges">
        <span class="badge">${exercise.equipment}</span>
      </div>
      <div class="card-footer">
        <button class="btn-details" type="button" data-id="${exercise.id}">View Details</button>
      </div>
    </div>
  `;

  return li;
}

export function renderModal(exercise) {
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
      <h2 class="modal-title" id="modal-title">${exercise.name}</h2>
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
