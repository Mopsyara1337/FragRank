import { players } from './players.js';
import { rankPlayers } from './metrics.js';
import { initPlayerSearch } from './player-search.js';

// Same global positions and FragScore as the ranking and homepage.
const rankedPlayers = rankPlayers(players);
const playerId = new URLSearchParams(window.location.search).get('id')?.trim();
const player = rankedPlayers.find((entry) => entry.id === playerId);
const title = document.querySelector('#profile-title');
const description = document.querySelector('#profile-description');

const integerFormat = new Intl.NumberFormat('ru-RU');
const decimalFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatMetric(key, value) {
  if (key === 'kd' || key === 'fragScore') return decimalFormat.format(value);
  if (key === 'adr') return shortFormat.format(value);
  if (key === 'hs' || key === 'winRate') return `${shortFormat.format(value)}%`;
  return typeof value === 'number' ? integerFormat.format(value) : value;
}

function showPicker() {
  title.textContent = 'Выберите игрока';
  description.textContent = 'Откройте профиль любого участника из общего набора FragRank.';
  document.title = 'Выбор игрока — FragRank';
  initPlayerSearch(players);
  document.querySelector('#player-picker').hidden = false;
}

function showNotFound() {
  title.textContent = 'Игрок не найден';
  description.textContent = 'В общем наборе FragRank нет участника с таким идентификатором.';
  document.title = 'Игрок не найден — FragRank';
  document.querySelector('#player-not-found').hidden = false;
}

function showProfile() {
  description.textContent = 'Позиция в общем рейтинге и демонстрационные результаты игрока Counter-Strike 2.';
  document.title = `${player.nickname} — профиль игрока — FragRank`;
  document.querySelector('#profile-breadcrumb').textContent = player.nickname;
  document.querySelector('#profile-nickname').textContent = player.nickname;
  document.querySelector('#profile-avatar').textContent = player.nickname.slice(0, 2).toUpperCase();
  document.querySelector('#profile-position').textContent = `#${String(player.position).padStart(2, '0')}`;
  document.querySelector('#profile-player-count').textContent = players.length;
  document.querySelectorAll('[data-player-value]').forEach((element) => {
    const key = element.dataset.playerValue;
    element.textContent = formatMetric(key, player[key]);
  });

  document.querySelectorAll('[data-chart-metric]').forEach((row) => {
    const key = row.dataset.chartMetric;
    const bar = row.querySelector('[role="meter"]');
    const maximum = Number(bar.getAttribute('aria-valuemax'));
    const value = player[key];
    const scaledValue = Math.min(Math.max(value, 0), maximum);
    row.querySelector('.profile-bar-fill').style.width = `${scaledValue / maximum * 100}%`;
    bar.setAttribute('aria-valuenow', String(scaledValue));
    bar.setAttribute('aria-valuetext', `${formatMetric(key, value)}; шкала от 0 до ${maximum}${value > maximum ? '; значение выше ориентира' : ''}`);
  });

  document.querySelector('#compare-player').href = `compare.html?id=${encodeURIComponent(player.id)}`;
  document.querySelector('#player-profile').hidden = false;
}

if (!playerId) showPicker();
else if (!player) showNotFound();
else showProfile();

document.querySelector('#profile-fallback').hidden = true;
