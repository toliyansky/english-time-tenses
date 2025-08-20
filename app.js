'use strict';

/**
 * Loads tenses from JSON and renders a table with Active/Passive toggle.
 */
(function init() {
  const TABLE_ID = 'tensesTable';
  const BTN_ACTIVE_ID = 'btnActive';
  const BTN_PASSIVE_ID = 'btnPassive';
  const ERROR_ID = 'errorSection';
  const DATA_FILE = './time-tenses.json';

  /** @type {HTMLElement|null} */
  const table = document.getElementById(TABLE_ID);
  /** @type {HTMLButtonElement|null} */
  const btnActive = document.getElementById(BTN_ACTIVE_ID);
  /** @type {HTMLButtonElement|null} */
  const btnPassive = document.getElementById(BTN_PASSIVE_ID);
  /** @type {HTMLElement|null} */
  const errorSection = document.getElementById(ERROR_ID);
  /** @type {HTMLElement|null} */
  const controls = document.querySelector('.controls');

  if (!table || !btnActive || !btnPassive || !errorSection || !controls) {
    console.error('Required elements are missing in the DOM.');
    return;
  }

  let state = {
    voice: 'active', // 'active' | 'passive'
    data: null,
  };

  // Initialize UI state of labels
  updateControlsState();

  // Load and render
  loadData()
    .then((data) => {
      state.data = data;
      render();
    })
    .catch((err) => showError(err));

  // Attach toggle listener
  btnActive.addEventListener('click', () => { state.voice = 'active'; updateControlsState(); render(); });
  btnPassive.addEventListener('click', () => { state.voice = 'passive'; updateControlsState(); render(); });

  function updateControlsState() {
    controls.classList.toggle('is-active', state.voice === 'active');
    controls.classList.toggle('is-passive', state.voice === 'passive');
  }

  function showError(err) {
    errorSection.hidden = false;
    errorSection.textContent = 'Ошибка загрузки данных: ' + (err && err.message ? err.message : String(err));
  }

  async function loadData() {
    const response = await fetch(DATA_FILE, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' while fetching ' + DATA_FILE);
    }
    return response.json();
  }

  function render() {
    if (!state.data) { return; }
    const tbody = table.querySelector('tbody');
    if (!tbody) { return; }
    tbody.innerHTML = '';

    const voiceKey = state.voice; // 'active' | 'passive'

    // Order of aspect columns
    const columnOrder = ['Simple', 'Continuous', 'Perfect', 'Perfect Continuous'];

    for (const tense of state.data.tenses) {
      const row = document.createElement('tr');

      // First column: Time
      const tdTime = document.createElement('td');
      tdTime.appendChild(renderTimeCell(tense.time));
      row.appendChild(tdTime);

      // Map aspects by name for quick access
      const nameToAspect = {};
      for (const aspect of tense.aspects) {
        nameToAspect[aspect.name] = aspect;
      }

      // For each aspect column, render one cell
      for (const aspectName of columnOrder) {
        const aspect = nameToAspect[aspectName];
        const td = document.createElement('td');
        td.appendChild(renderCellContent(aspect, voiceKey));
        row.appendChild(td);
      }

      tbody.appendChild(row);
    }
  }

  function indexByType(structures) {
    const map = {};
    for (const s of structures) {
      map[s.type] = s;
    }
    return map;
  }

  function renderFormula(entry, type) {
    if (!entry || !entry.formula) { return '<span class="muted">—</span>'; }
    const typeClass = type ? ' formula--' + type : '';
    return '<div class="formula' + typeClass + '">' + escapeHtml(entry.formula) + '</div>';
  }

  function renderCellContent(aspect, voiceKey) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cell-content';

    if (!aspect) {
      const none = document.createElement('span');
      none.className = 'muted';
      none.textContent = '—';
      wrapper.appendChild(none);
      return wrapper;
    }

    if (aspect.description) {
      const desc = document.createElement('div');
      desc.className = 'cell-desc';
      desc.textContent = aspect.description;
      wrapper.appendChild(desc);
    }

    const structures = (aspect.structures && aspect.structures[voiceKey]) || [];
    const byType = indexByType(structures);

    const aff = document.createElement('div');
    aff.className = 'cell-block';
    aff.innerHTML = renderFormula(byType['Affirmative'], 'aff');
    wrapper.appendChild(aff);

    const neg = document.createElement('div');
    neg.className = 'cell-block';
    neg.innerHTML = renderFormula(byType['Negative'], 'neg');
    wrapper.appendChild(neg);

    const q = document.createElement('div');
    q.className = 'cell-block';
    q.innerHTML = renderFormula(byType['Question'], 'q');
    wrapper.appendChild(q);

    const markersBlock = document.createElement('div');
    markersBlock.className = 'cell-block';
    markersBlock.appendChild(renderMarkers(aspect.markers || []));
    wrapper.appendChild(markersBlock);

    return wrapper;
  }

  function renderTimeCell(timeName) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cell-content';
    const title = document.createElement('div');
    title.className = 'time-name';
    title.textContent = timeName;
    wrapper.appendChild(title);
    return wrapper;
  }

  function renderMarkers(markers) {
    const wrapper = document.createElement('div');
    wrapper.className = 'markers';
    for (const m of markers) {
      const chip = document.createElement('span');
      chip.className = 'marker-chip';
      chip.textContent = m;
      wrapper.appendChild(chip);
    }
    if (markers.length === 0) {
      const none = document.createElement('span');
      none.className = 'muted';
      none.textContent = '—';
      wrapper.appendChild(none);
    }
    return wrapper;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();


