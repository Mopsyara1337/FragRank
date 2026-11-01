import test from 'node:test';
import assert from 'node:assert/strict';
import { players } from '../js/players.js';
import { rankPlayers } from '../js/metrics.js';
import { buildStatistics, countPlayersBy, getKDBucketIndex, getKDDistribution, getTopPlayers, sortGroups } from '../js/statistics.js';

const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('summary uses arithmetic means per player, not pooled or match-weighted rates', () => {
  const { summary } = buildStatistics(players);
  assert.equal(summary.players, 30);
  assert.equal(summary.teams, 6);
  assert.equal(summary.countries, 18);
  closeTo(summary.averageKD, 1.123929015274264);
  closeTo(summary.averageADR, 80.1);
  closeTo(summary.averageWinRate, 65.19528056484577);
  const pooledKD = players.reduce((sum, p) => sum + p.kills, 0) / players.reduce((sum, p) => sum + p.deaths, 0);
  const pooledWins = players.reduce((sum, p) => sum + p.wins, 0) / players.reduce((sum, p) => sum + p.matches, 0) * 100;
  assert.ok(Math.abs(summary.averageKD - pooledKD) > 0.001);
  assert.ok(Math.abs(summary.averageWinRate - pooledWins) > 0.001);
});

test('country counts and percentages cover all participants exactly once', () => {
  const groups = countPlayersBy(players, 'country');
  assert.deepEqual(Object.fromEntries(groups.map((group) => [group.name, group.count])), {
    'Россия': 5, 'Украина': 3, 'Франция': 2, 'Израиль': 3,
    'Великобритания': 1, 'Босния и Герцеговина': 2, 'Гватемала': 1,
    'Польша': 2, 'Литва': 1, 'Румыния': 1, 'Финляндия': 2,
    'Эстония': 1, 'Словакия': 1, 'Латвия': 1, 'Норвегия': 1,
    'Дания': 1, 'Венгрия': 1, 'Швеция': 1,
  });
  assert.equal(groups.reduce((sum, group) => sum + group.count, 0), players.length);
  closeTo(groups.reduce((sum, group) => sum + group.percentage, 0), 100);
  closeTo(groups.find((group) => group.name === 'Россия').percentage, 100 / 6);
});

test('team counts sort in both directions without mutating the groups', () => {
  const groups = countPlayersBy(players, 'team');
  assert.equal(groups.length, 6);
  assert.ok(groups.every((group) => group.count === 5));
  const snapshot = JSON.stringify(groups);
  assert.deepEqual(sortGroups(groups).map((group) => group.name), [
    'FaZe Clan', 'G2 Esports', 'MOUZ', 'Natus Vincere', 'Team Spirit', 'Team Vitality',
  ]);
  assert.equal(JSON.stringify(groups), snapshot);
  // A subset of existing records exercises unequal sizes without invented players.
  const subset = countPlayersBy(players.slice(0, 7), 'team');
  assert.deepEqual(sortGroups(subset, 'desc').map((group) => group.count), [5, 2]);
  assert.deepEqual(sortGroups(subset, 'asc').map((group) => group.count), [2, 5]);
});

test('K/D intervals include each boundary once and have no decimal gaps', () => {
  for (const [value, index] of [
    [0, 0], [0.999999, 0], [1, 1], [1.19, 1], [1.199999, 1],
    [1.2, 2], [1.399999, 2], [1.4, 3], [1.599999, 3], [1.6, 4], [2, 4], [Infinity, 4],
  ]) assert.equal(getKDBucketIndex(value), index, `K/D ${value}`);
  assert.equal(getKDBucketIndex(-1), -1);
  assert.equal(getKDBucketIndex(NaN), -1);
});

test('actual K/D distribution includes all 30 players and retains the empty range', () => {
  const groups = getKDDistribution(players);
  assert.deepEqual(groups.map((group) => group.count), [7, 14, 5, 4, 0]);
  assert.equal(groups.reduce((sum, group) => sum + group.count, 0), players.length);
  closeTo(groups.reduce((sum, group) => sum + group.percentage, 0), 100);
  // Spinx displays as 1.20, but its unrounded value is below 1.2.
  assert.equal(getKDBucketIndex(players.find((player) => player.id === 'spinx').kd), 1);
});

test('all five top tens are descending, deterministic, and preserve source records', () => {
  const ranked = rankPlayers(players);
  const original = JSON.stringify(players);
  const rankOrder = ranked.map((player) => player.id);
  for (const [metric, leader] of Object.entries({ fragScore: 'donk', kd: 'monesy', adr: 'donk', hs: 'b1t', winRate: 'donk' })) {
    const top = getTopPlayers(ranked, metric);
    assert.equal(top.length, 10);
    assert.equal(top[0].id, leader);
    assert.equal(new Set(top.map((player) => player.id)).size, 10);
    top.forEach((player, index) => {
      assert.ok(ranked.includes(player));
      if (index) {
        assert.ok(top[index - 1][metric] >= player[metric]);
        if (top[index - 1][metric] === player[metric]) assert.ok(top[index - 1].position < player.position);
      }
    });
  }
  assert.deepEqual(ranked.map((player) => player.id), rankOrder);
  assert.equal(JSON.stringify(players), original);
});

test('empty input produces zero summaries and keeps all five K/D ranges', () => {
  const result = buildStatistics([]);
  assert.deepEqual(result.summary, { players: 0, teams: 0, countries: 0, averageKD: 0, averageADR: 0, averageWinRate: 0 });
  assert.deepEqual(result.countries, []);
  assert.deepEqual(result.teams, []);
  assert.deepEqual(result.kdDistribution.map((group) => group.count), [0, 0, 0, 0, 0]);
  assert.deepEqual(getTopPlayers([], 'fragScore'), []);
});
