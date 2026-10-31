// The combobox receives the shared dataset; matches are references to its players.
export function initPlayerSearch(players) {
  const form = document.querySelector('.profile-picker-form');
  const field = form.querySelector('.player-autocomplete');
  const input = form.querySelector('#profile-search');
  const selectedId = form.querySelector('#selected-player-id');
  const submitButton = form.querySelector('[type="submit"]');
  const popup = form.querySelector('.player-search-popup');
  const list = form.querySelector('#player-suggestions');
  const emptyMessage = form.querySelector('.player-search-empty');
  const status = document.querySelector('#profile-search-status');
  const template = document.querySelector('#player-suggestion-template');
  let matches = [];
  let selectedPlayer = null;
  let activeIndex = -1;

  function clearSelection() {
    selectedPlayer = null;
    selectedId.value = '';
    submitButton.disabled = true;
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
      option.id = `player-suggestion-${entry.id}`;
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
    selectedPlayer = entry;
    input.value = entry.nickname;
    selectedId.value = entry.id;
    submitButton.disabled = false;
    closeSuggestions();
    status.textContent = `Выбран ${entry.nickname}, ${entry.team}. Можно открыть профиль.`;
    input.focus({ preventScroll: true });
  }

  input.addEventListener('input', () => {
    // Even editing a selected nickname back to the same text requires a new choice.
    clearSelection();
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
  form.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !field.contains(event.relatedTarget)) closeSuggestions();
  });

  form.addEventListener('submit', (event) => {
    // Guard Enter/programmatic submits as well as the disabled button.
    if (!selectedPlayer || input.value !== selectedPlayer.nickname || selectedId.value !== selectedPlayer.id) {
      event.preventDefault();
      clearSelection();
      input.focus();
      renderSuggestions();
    }
  });
}
