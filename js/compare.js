import { players } from './players.js';
import { rankPlayers } from './metrics.js';
import { createPlayerAutocomplete } from './player-search.js';

const rankedPlayers = rankPlayers(players);
const selected = { left: null, right: null };
const controls = {};
const notice = document.querySelector('#compare-notice');
const status = document.querySelector('#compare-status');
const swapButton = document.querySelector('#swap-players');
const rows = document.querySelector('#compare-metric-rows');
const rowTemplate = document.querySelector('#compare-metric-template');
const decimal = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('ru-RU');

// Presentation metadata only. All player values come from the shared dataset.
const metrics = [
  { key: 'fragScore', label: 'FragScore', maximum: 100, unit: 'баллов', format: decimal },
  { key: 'kd', label: 'K/D', maximum: 2, unit: 'убийства / смерть', format: decimal },
  { key: 'adr', label: 'ADR', maximum: 120, unit: 'урона / раунд', format: short },
  { key: 'hs', label: 'HS%', maximum: 100, unit: '%', format: short },
  { key: 'winRate', label: 'Win Rate', maximum: 100, unit: '%', format: short },
];

function clearNotice() {
  notice.hidden = true;
  notice.textContent = '';
}

function syncUrl() {
  // Only id describes the left participant. The right field starts empty on load.
  const url = new URL(window.location.href);
  if (selected.left) url.searchParams.set('id', selected.left.id);
  else url.searchParams.delete('id');
  if (url.href !== window.location.href) window.history.replaceState(null, '', url);
}

function renderIdentity(side) {
  const card = document.querySelector(`[data-player-side="${side}"]`);
  const entry = selected[side];
  card.querySelector('[data-identity]').hidden = !entry;
  card.querySelector('[data-placeholder]').hidden = Boolean(entry);
  if (!entry) return;
  const link = card.querySelector('[data-profile-link]');
  link.textContent = entry.nickname;
  link.href = `player.html?id=${encodeURIComponent(entry.id)}`;
  card.querySelector('[data-avatar]').textContent = entry.nickname.slice(0, 2).toUpperCase();
  card.querySelector('[data-team]').textContent = entry.team;
  card.querySelector('[data-country]').textContent = entry.country;
  card.querySelector('[data-position]').textContent = `#${String(entry.position).padStart(2, '0')} из ${players.length}`;
}

function renderMetrics() {
  const fragment = document.createDocumentFragment();
  metrics.forEach((metric) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector('.comparison-row').dataset.metric = metric.key;
    row.querySelector('[data-metric-label]').textContent = metric.label;
    // A single scale per pair preserves comparable lengths, including above-base values.
    const maximum = Math.max(metric.maximum, selected.left[metric.key], selected.right[metric.key]);
    row.querySelector('[data-scale]').textContent = `0–${integer.format(maximum)} ${metric.unit}`;
    const equal = selected.left[metric.key] === selected.right[metric.key];
    for (const side of ['left', 'right']) {
      const other = side === 'left' ? 'right' : 'left';
      const entry = selected[side];
      const value = entry[metric.key];
      const better = value > selected[other][metric.key];
      const cell = row.querySelector(`[data-comparison-side="${side}"]`);
      const formatted = `${metric.format.format(value)}${metric.unit === '%' ? '%' : ''}`;
      const result = equal ? 'Равно' : (better ? 'Выше' : 'Ниже');
      cell.classList.toggle('is-better', better);
      cell.querySelector('[data-value]').textContent = formatted;
      cell.querySelector('[data-result]').textContent = result;
      cell.querySelector('.comparison-fill').style.width = `${value / maximum * 100}%`;
      const meter = cell.querySelector('[role="meter"]');
      meter.setAttribute('aria-label', `${entry.nickname}: ${metric.label}`);
      meter.setAttribute('aria-valuemin', '0');
      meter.setAttribute('aria-valuemax', String(maximum));
      meter.setAttribute('aria-valuenow', String(value));
      meter.setAttribute('aria-valuetext', `${formatted}; ${result.toLocaleLowerCase('ru')}`);
    }
    fragment.append(row);
  });
  rows.replaceChildren(fragment);

  document.querySelectorAll('[data-side-name]').forEach((element) => {
    element.textContent = selected[element.dataset.sideName].nickname;
  });
  document.querySelectorAll('[data-volume]').forEach((card) => {
    for (const side of ['left', 'right']) {
      card.querySelector(`[data-volume-value="${side}"]`).textContent = integer.format(selected[side][card.dataset.volume]);
    }
  });
}

function render() {
  const count = Number(Boolean(selected.left)) + Number(Boolean(selected.right));
  const complete = count === 2;
  swapButton.disabled = count === 0;
  document.querySelector('#compare-players').hidden = count === 0;
  document.querySelector('#compare-results').hidden = !complete;
  document.querySelector('#compare-empty').hidden = complete;
  renderIdentity('left');
  renderIdentity('right');
  if (complete) {
    renderMetrics();
    status.textContent = `${selected.left.nickname} и ${selected.right.nickname}: сравнение обновлено.`;
    document.title = `${selected.left.nickname} и ${selected.right.nickname} — сравнение — FragRank`;
  } else {
    rows.replaceChildren();
    document.title = 'Сравнение игроков — FragRank';
    document.querySelector('#compare-empty-title').textContent = count ? 'Выберите второго игрока' : 'Выберите двух игроков';
    const entry = selected.left || selected.right;
    document.querySelector('#compare-empty-description').textContent = entry
      ? `${entry.nickname} уже выбран ${selected.left ? 'слева' : 'справа'}. Найдите другого участника в ${selected.left ? 'правом' : 'левом'} поле.`
      : 'Введите никнеймы в поля выше и подтвердите выбор подсказками.';
    status.textContent = `Выбрано игроков: ${count} из 2.`;
  }
}

for (const side of ['left', 'right']) {
  const other = side === 'left' ? 'right' : 'left';
  controls[side] = createPlayerAutocomplete(document.querySelector(`#compare-${side}-field`), rankedPlayers, {
    status: document.querySelector(`#compare-${side}-status`),
    onChange: (entry) => {
      selected[side] = entry;
      clearNotice();
      render();
      syncUrl();
    },
    validateSelection: (entry) => selected[other]?.id === entry.id
      ? 'Этот игрок уже выбран в другом поле. Выберите двух разных участников.' : '',
    onInvalid: (message) => {
      notice.textContent = message;
      notice.hidden = false;
    },
  });
}

swapButton.addEventListener('click', () => {
  [selected.left, selected.right] = [selected.right, selected.left];
  controls.left.setPlayer(selected.left);
  controls.right.setPlayer(selected.right);
  clearNotice();
  render();
  syncUrl();
});

document.querySelector('#reset-comparison').addEventListener('click', () => {
  selected.left = null;
  selected.right = null;
  controls.left.setPlayer(null);
  controls.right.setPlayer(null);
  clearNotice();
  render();
  syncUrl();
  document.querySelector('#compare-left-search').focus();
});

const initialId = new URLSearchParams(window.location.search).get('id')?.trim();
if (initialId) {
  selected.left = rankedPlayers.find((entry) => entry.id === initialId) || null;
  if (selected.left) controls.left.setPlayer(selected.left);
  else {
    notice.textContent = 'Игрок из ссылки не найден. Выберите участников вручную.';
    notice.hidden = false;
  }
}
render();
document.querySelector('#compare-interface').hidden = false;
document.querySelector('#compare-fallback').hidden = true;
