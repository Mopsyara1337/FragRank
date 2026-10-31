// Independent combobox instances share player references and the same behavior.
// setPlayer() updates a controlled field silently (prefill, swap, reset).
export function createPlayerAutocomplete(field, players, {
  status,
  onChange = () => {},
  validateSelection = () => '',
  onInvalid = () => {},
} = {}) {
  const input = field.querySelector('[role="combobox"]');
  const selectedId = field.querySelector('[type="hidden"]');
  const popup = field.querySelector('.player-search-popup');
  const list = field.querySelector('[role="listbox"]');
  const emptyMessage = field.querySelector('.player-search-empty');
  const template = document.querySelector('#player-suggestion-template');
  let matches = [];
  let selectedPlayer = null;
  let activeIndex = -1;

  function clearSelection() {
    selectedPlayer = null;
    if (selectedId) selectedId.value = '';
    input.removeAttribute('aria-invalid');
  }

  function closeSuggestions() {
    popup.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
    for (const option of list.children) option.setAttribute('aria-selected', 'false');
  }

  function renderSuggestions() {
    const query = input.value.trim().toLocaleLowerCase('en');
    closeSuggestions();
    list.replaceChildren();
    matches = query ? players.filter((entry) => entry.nickname.toLocaleLowerCase('en').includes(query)) : [];
    if (!query) {
      status.textContent = '';
      return;
    }

    const fragment = document.createDocumentFragment();
    matches.forEach((entry, index) => {
      const suggestion = template.content.cloneNode(true);
      const option = suggestion.querySelector('[role="option"]');
      option.id = `${list.id}-${entry.id}`;
      option.dataset.index = index;
      suggestion.querySelector('[data-suggestion-avatar]').textContent = entry.nickname.slice(0, 2).toUpperCase();
      suggestion.querySelector('[data-suggestion-name]').textContent = entry.nickname;
      suggestion.querySelector('[data-suggestion-team]').textContent = entry.team;
      fragment.append(suggestion);
    });
    list.append(fragment);
    emptyMessage.hidden = matches.length > 0;
    popup.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    status.textContent = matches.length ? `Найдено игроков: ${matches.length}. Выберите подсказку.` : 'Игроки не найдены';
  }

  function activateSuggestion(index) {
    activeIndex = index;
    for (const [optionIndex, option] of [...list.children].entries()) {
      option.setAttribute('aria-selected', String(optionIndex === activeIndex));
    }
    const activeOption = list.children[activeIndex];
    input.setAttribute('aria-activedescendant', activeOption.id);
    activeOption.scrollIntoView({ block: 'nearest' });
  }

  function selectPlayer(entry) {
    const error = validateSelection(entry);
    if (error) {
      clearSelection();
      onChange(null);
      closeSuggestions();
      input.setAttribute('aria-invalid', 'true');
      status.textContent = error;
      onInvalid(error);
      return;
    }
    setPlayer(entry);
    onChange(entry);
    input.focus({ preventScroll: true });
  }

  function setPlayer(entry) {
    selectedPlayer = entry;
    input.value = entry?.nickname || '';
    if (selectedId) selectedId.value = entry?.id || '';
    input.removeAttribute('aria-invalid');
    closeSuggestions();
    status.textContent = entry ? `Выбран ${entry.nickname}, ${entry.team}.` : '';
  }

  input.addEventListener('input', () => {
    // Even editing a selected nickname back to the same text requires a new choice.
    clearSelection();
    onChange(null);
    renderSuggestions();
  });
  input.addEventListener('focus', () => {
    if (!selectedPlayer) renderSuggestions();
  });
  input.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape' && !popup.hidden) event.preventDefault();
      closeSuggestions();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (popup.hidden) renderSuggestions();
      if (!matches.length) return;
      const nextIndex = event.key === 'ArrowDown'
        ? (activeIndex + 1) % matches.length
        : (activeIndex <= 0 ? matches.length - 1 : activeIndex - 1);
      activateSuggestion(nextIndex);
    } else if (event.key === 'Enter' && !popup.hidden && matches.length) {
      event.preventDefault();
      selectPlayer(matches[activeIndex < 0 ? 0 : activeIndex]);
    }
  });

  // Keep focus on the combobox during mouse selection; touch scrolling stays native.
  list.addEventListener('mousedown', (event) => event.preventDefault());
  list.addEventListener('click', (event) => {
    const option = event.target.closest('[role="option"]');
    if (option) selectPlayer(matches[Number(option.dataset.index)]);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!field.contains(event.target)) closeSuggestions();
  });
  field.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !field.contains(event.relatedTarget)) closeSuggestions();
  });

  return {
    setPlayer,
    getPlayer: () => selectedPlayer && input.value === selectedPlayer.nickname
      && (!selectedId || selectedId.value === selectedPlayer.id) ? selectedPlayer : null,
  };
}

// Profile form adapter: keep its native GET navigation and submission guard.
export function initPlayerSearch(players) {
  const form = document.querySelector('.profile-picker-form');
  const input = form.querySelector('[role="combobox"]');
  const submitButton = form.querySelector('[type="submit"]');
  const search = createPlayerAutocomplete(form.querySelector('.player-autocomplete'), players, {
    status: document.querySelector('#profile-search-status'),
    onChange: (entry) => { submitButton.disabled = !entry; },
  });
  form.addEventListener('submit', (event) => {
    // Guard Enter/programmatic submits as well as the disabled button.
    if (!search.getPlayer()) {
      event.preventDefault();
      search.setPlayer(null);
      submitButton.disabled = true;
      input.focus();
    }
  });
}
