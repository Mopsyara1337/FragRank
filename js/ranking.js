import { players } from './players.js';
import { rankPlayers } from './metrics.js';

// Global positions always refer to FragScore descending, even after filtering.
const rankedPlayers = rankPlayers(players);
const form = document.querySelector('#ranking-filters');
const searchInput = document.querySelector('#player-search');
const countrySelect = document.querySelector('#country-filter');
const teamSelect = document.querySelector('#team-filter');
const tableBody = document.querySelector('#ranking-body');
const rowTemplate = document.querySelector('#ranking-row-template');
const emptyMessage = document.querySelector('#ranking-empty');
const resultCount = document.querySelector('#ranking-count');
const sortButtons = [...document.querySelectorAll('[data-sort]')];
const tableRegion = document.querySelector('#ranking-table-region');
const defaultSort = { key: 'fragScore', direction: 'desc' };
let sort = { ...defaultSort };

const decimalFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function populateFilter(select, values) {
  [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru')).forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase('en');
  const visiblePlayers = rankedPlayers.filter((player) =>
    player.nickname.toLocaleLowerCase('en').includes(query)
    && (!countrySelect.value || player.country === countrySelect.value)
    && (!teamSelect.value || player.team === teamSelect.value));

  visiblePlayers.sort((a, b) => {
    const difference = a[sort.key] - b[sort.key];
    return (sort.direction === 'asc' ? difference : -difference) || a.position - b.position;
  });

  const fragment = document.createDocumentFragment();
  visiblePlayers.forEach((player) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector('[data-position]').textContent = String(player.position).padStart(2, '0');
    const link = row.querySelector('[data-player-link]');
    link.href = `player.html?id=${encodeURIComponent(player.id)}`;
    row.querySelector('[data-nickname]').textContent = player.nickname;
    row.querySelector('[data-avatar]').textContent = player.nickname.slice(0, 2).toUpperCase();
    row.querySelector('[data-team]').textContent = player.team;
    row.querySelector('[data-country]').textContent = player.country;
    row.querySelector('[data-kd]').textContent = decimalFormat.format(player.kd);
    row.querySelector('[data-adr]').textContent = shortFormat.format(player.adr);
    row.querySelector('[data-hs]').textContent = `${shortFormat.format(player.hs)}%`;
    row.querySelector('[data-win-rate]').textContent = `${shortFormat.format(player.winRate)}%`;
    row.querySelector('[data-frag-score]').textContent = decimalFormat.format(player.fragScore);
    row.querySelector('tr').classList.toggle('ranking-leader', player.position === 1);
    fragment.append(row);
  });
  tableBody.replaceChildren(fragment);
  tableRegion.hidden = visiblePlayers.length === 0;
  emptyMessage.hidden = visiblePlayers.length > 0;

  sortButtons.forEach((button) => {
    const active = sort.key === button.dataset.sort;
    const direction = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
    button.closest('th').setAttribute('aria-sort', direction);
    button.querySelector('.sort-indicator').textContent = active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕';
    const nextDirection = active && sort.direction === 'desc' ? 'возрастанию' : 'убыванию';
    button.setAttribute('aria-label', `${button.dataset.label}: сортировать по ${nextDirection}`);
  });
  resultCount.textContent = `Показано: ${visiblePlayers.length} из ${players.length}`;
}

populateFilter(countrySelect, players.map((player) => player.country));
populateFilter(teamSelect, players.map((player) => player.team));

form.addEventListener('submit', (event) => event.preventDefault());
searchInput.addEventListener('input', render);
countrySelect.addEventListener('change', render);
teamSelect.addEventListener('change', render);
sortButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.sort;
    sort = { key, direction: sort.key === key && sort.direction === 'desc' ? 'asc' : 'desc' };
    render();
  });
});

function resetRanking() {
  form.reset();
  sort = { ...defaultSort };
  render();
  searchInput.focus();
}
document.querySelector('#reset-ranking').addEventListener('click', resetRanking);
document.querySelector('#reset-empty-ranking').addEventListener('click', resetRanking);

// Enable controls after data and handlers are ready, keeping no-JS fallback clear.
form.querySelector('fieldset').disabled = false;
document.querySelector('#ranking-loading').hidden = true;
render();
