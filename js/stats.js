import { players } from './players.js';
import { rankPlayers } from './metrics.js';
import { buildStatistics, getTopPlayers, sortGroups } from './statistics.js';

const statistics = buildStatistics(players);
const rankedPlayers = rankPlayers(players);
const decimal = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const short = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const precise = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 20 });
const metricSelect = document.querySelector('#stats-metric');
const teamSort = document.querySelector('#stats-team-sort');
const topTemplate = document.querySelector('#stats-top-row-template');
const distributionTemplate = document.querySelector('#stats-distribution-template');

// Axis/label metadata only; all values are read from the shared player records.
const metrics = [
  { key: 'fragScore', label: 'FragScore', maximum: 100, unit: 'баллов / 100', format: decimal },
  { key: 'kd', label: 'K/D', maximum: 2, unit: 'убийства / смерть', format: decimal },
  { key: 'adr', label: 'ADR', maximum: 120, unit: 'урона / раунд', format: short },
  { key: 'hs', label: 'HS%', maximum: 100, unit: 'убийства в голову', format: short, percent: true },
  { key: 'winRate', label: 'Win Rate', maximum: 100, unit: 'доля выигранных карт', format: short, percent: true },
];

function renderSummary() {
  document.querySelectorAll('[data-stats-summary]').forEach((element) => {
    const key = element.dataset.statsSummary;
    const value = statistics.summary[key];
    if (key === 'averageKD') element.textContent = decimal.format(value);
    else if (key === 'averageADR') element.textContent = short.format(value);
    else if (key === 'averageWinRate') element.textContent = `${short.format(value)}%`;
    else element.textContent = integer.format(value);
  });
}

function renderTopPlayers() {
  const metric = metrics.find((entry) => entry.key === metricSelect.value) || metrics[0];
  const top = getTopPlayers(rankedPlayers, metric.key);
  const maximum = Math.max(metric.maximum, ...top.map((player) => player[metric.key]));
  const fragment = document.createDocumentFragment();
  top.forEach((player, index) => {
    const row = topTemplate.content.cloneNode(true);
    row.querySelector('li').classList.toggle('is-top-value', player[metric.key] === top[0][metric.key]);
    const link = row.querySelector('a');
    link.href = `player.html?id=${encodeURIComponent(player.id)}`;
    link.dataset.playerId = player.id;
    row.querySelector('[data-top-position]').textContent = String(index + 1).padStart(2, '0');
    row.querySelector('[data-top-avatar]').textContent = player.nickname.slice(0, 2).toUpperCase();
    row.querySelector('[data-top-nickname]').textContent = player.nickname;
    row.querySelector('[data-top-team]').textContent = player.team;
    const suffix = metric.percent ? '%' : '';
    const value = row.querySelector('[data-top-value]');
    value.textContent = `${metric.format.format(player[metric.key])}${suffix}`;
    value.title = `Неокруглённое значение: ${precise.format(player[metric.key])}${suffix}`;
    row.querySelector('[data-top-unit]').textContent = metric.unit;
    row.querySelector('.stats-chart-fill').style.width = `${player[metric.key] / maximum * 100}%`;
    fragment.append(row);
  });
  document.querySelector('#stats-top-list').replaceChildren(fragment);
  document.querySelector('#stats-top-title').textContent = `Топ-10 по ${metric.label}`;
  document.querySelector('#stats-top-status').textContent = `Показано ${top.length} игроков по убыванию ${metric.label}. Нажмите игрока, чтобы открыть профиль.`;
  document.querySelector('#stats-axis-middle').textContent = `${metric.format.format(maximum / 2)}${metric.percent ? '%' : ''}`;
  document.querySelector('#stats-axis-max').textContent = `${metric.format.format(maximum)}${metric.percent ? '%' : ''}`;
  document.querySelector('#stats-axis-unit').textContent = metric.percent ? '%' : metric.unit;
}

function renderDistribution(list, groups, { showPercent = true } = {}) {
  const maximum = Math.max(1, ...groups.map((group) => group.count));
  const fragment = document.createDocumentFragment();
  groups.forEach((group) => {
    const row = distributionTemplate.content.cloneNode(true);
    row.querySelector('li').classList.toggle('is-largest-group', group.count > 0 && group.count === maximum);
    row.querySelector('[data-group-name]').textContent = group.name || group.label;
    row.querySelector('[data-group-count]').textContent = integer.format(group.count);
    const percent = row.querySelector('[data-group-percent]');
    percent.hidden = !showPercent;
    percent.textContent = `${short.format(group.percentage)}%`;
    const detail = row.querySelector('[data-group-detail]');
    detail.hidden = !group.interval;
    detail.textContent = group.interval || '';
    row.querySelector('.stats-chart-fill').style.width = `${group.count / maximum * 100}%`;
    fragment.append(row);
  });
  list.replaceChildren(fragment);
  return maximum;
}

// Render all rows once; disclosure only changes visibility, never the data or scale.
// The returned updater reapplies the same expansion state after a sort.
function createDistributionDisclosure(list, button, limit, noun) {
  let expanded = false;
  function update() {
    const count = list.children.length;
    const canExpand = count > limit;
    if (!canExpand) expanded = false;
    let index = 0;
    for (const row of list.children) {
      row.hidden = !expanded && index >= limit;
      index += 1;
    }
    button.parentElement.hidden = !canExpand;
    button.textContent = expanded ? 'Свернуть' : `Показать все ${count} ${noun}`;
    button.setAttribute('aria-expanded', String(expanded));
  }
  button.addEventListener('click', () => {
    expanded = !expanded;
    update();
    if (!expanded) button.scrollIntoView({ block: 'nearest' });
  });
  update();
  return update;
}

function renderTeams() {
  const groups = sortGroups(statistics.teams, teamSort.value);
  const maximum = renderDistribution(document.querySelector('#stats-team-list'), groups, { showPercent: false });
  document.querySelector('#stats-team-scale').textContent = `Шкала: 0–${maximum} игроков. При равной численности — по названию.`;
  document.querySelector('#stats-team-status').textContent = `Команды: ${groups.length}. По численности ${teamSort.value === 'asc' ? 'по возрастанию' : 'по убыванию'}.`;
  const sameSize = groups.length > 0 && groups.every((group) => group.count === groups[0].count);
  document.querySelector('#stats-team-note').textContent = sameSize
    ? `Количество представленных игроков по командам. Сейчас у всех ${groups.length} команд по ${groups[0].count} игроков.`
    : 'Количество представленных игроков по командам.';
  updateTeamDisclosure();
}

const updateTeamDisclosure = createDistributionDisclosure(
  document.querySelector('#stats-team-list'), document.querySelector('#stats-team-toggle'), 6, 'команд',
);
renderSummary();
renderTopPlayers();
const countryMaximum = renderDistribution(document.querySelector('#stats-country-list'), sortGroups(statistics.countries));
createDistributionDisclosure(
  document.querySelector('#stats-country-list'), document.querySelector('#stats-country-toggle'), 8, 'стран',
);
document.querySelector('#stats-country-scale').textContent = `Шкала: 0–${countryMaximum} игроков. Доли округлены до одного знака.`;
renderTeams();
const kdMaximum = renderDistribution(document.querySelector('#stats-kd-list'), statistics.kdDistribution);
document.querySelector('#stats-kd-scale').textContent = `Шкала: 0–${kdMaximum} игроков; всего в распределении — ${statistics.kdDistribution.reduce((sum, group) => sum + group.count, 0)}.`;
metricSelect.addEventListener('change', renderTopPlayers);
teamSort.addEventListener('change', renderTeams);
document.querySelector('#stats-content').hidden = false;
document.querySelector('#stats-fallback').hidden = true;
