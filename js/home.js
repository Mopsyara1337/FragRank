import { players } from './players.js';
import { rankPlayers, summarizePlayers } from './metrics.js';

const decimalFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percentFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const leaders = rankPlayers(players).slice(0, 3);
const avatarColors = ['orange', 'green', 'violet'];

// The template defines structure; all data is inserted as text, never HTML.
const playerGrid = document.querySelector('#top-players');
const playerTemplate = document.querySelector('#player-card-template');

if (playerGrid && playerTemplate) {
  leaders.forEach((player, index) => {
    const card = playerTemplate.content.cloneNode(true);
    card.querySelector('[data-rank]').textContent = String(player.position).padStart(2, '0');
    const avatar = card.querySelector('[data-avatar]');
    avatar.textContent = player.nickname.slice(0, 2).toUpperCase();
    avatar.classList.add(`avatar--${avatarColors[index]}`);
    const link = card.querySelector('[data-player-link]');
    link.href = `player.html?id=${encodeURIComponent(player.id)}`;
    link.textContent = player.nickname;
    card.querySelector('[data-team]').textContent = player.team;
    card.querySelector('[data-rating]').textContent = decimalFormat.format(player.fragScore);
    card.querySelector('[data-kd]').textContent = decimalFormat.format(player.kd);
    card.querySelector('[data-hs]').textContent = `${percentFormat.format(player.hs)}%`;
    playerGrid.append(card);
  });
}

const leader = leaders[0];
if (leader) {
  document.querySelector('[data-leader-avatar]').textContent = leader.nickname.slice(0, 2).toUpperCase();
  document.querySelector('[data-leader-name]').textContent = leader.nickname;
  document.querySelector('[data-leader-team]').textContent = leader.team;
  document.querySelector('[data-leader-rating]').textContent = decimalFormat.format(leader.fragScore);
}

Object.entries(summarizePlayers(players)).forEach(([key, value]) => {
  const target = document.querySelector(`[data-total="${key}"]`);
  if (target) target.textContent = key === 'averageFragScore'
    ? decimalFormat.format(value) : value.toLocaleString('ru-RU');
});
