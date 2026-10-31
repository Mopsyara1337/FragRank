import { demoPlayers, demoSummary } from './demo-data.js';

const decimalFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// The template defines structure; all data is inserted as text, never HTML.
const playerGrid = document.querySelector('#top-players');
const playerTemplate = document.querySelector('#player-card-template');

if (playerGrid && playerTemplate) {
  demoPlayers.slice(0, 3).forEach((player, index) => {
    const card = playerTemplate.content.cloneNode(true);
    card.querySelector('[data-rank]').textContent = `0${index + 1}`;
    const avatar = card.querySelector('[data-avatar]');
    avatar.textContent = player.initials;
    avatar.classList.add(`avatar--${player.avatar}`);
    card.querySelector('[data-nickname]').textContent = player.nickname;
    card.querySelector('[data-team]').textContent = `${player.team} · ${player.role}`;
    card.querySelector('[data-rating]').textContent = decimalFormat.format(player.rating);
    card.querySelector('[data-kd]').textContent = decimalFormat.format(player.kd);
    card.querySelector('[data-hs]').textContent = `${player.hs}%`;
    playerGrid.append(card);
  });
}

const leader = demoPlayers[0];
if (leader) {
  document.querySelector('[data-leader-avatar]').textContent = leader.initials;
  document.querySelector('[data-leader-name]').textContent = leader.nickname;
  document.querySelector('[data-leader-team]').textContent = `${leader.team} / ${leader.role}`;
  document.querySelector('[data-leader-rating]').textContent = decimalFormat.format(leader.rating);
}

Object.entries(demoSummary).forEach(([key, value]) => {
  const target = document.querySelector(`[data-total="${key}"]`);
  if (target) target.textContent = value.toLocaleString('ru-RU');
});
