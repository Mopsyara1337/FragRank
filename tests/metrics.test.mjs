import test from 'node:test';
import assert from 'node:assert/strict';
import { players } from '../js/players.js';
import { demoPlayers } from '../js/demo-data.js';
import { calculateFragScore, calculatePlayerMetrics, rankPlayers, summarizePlayers } from '../js/metrics.js';

test('FragScore follows the weighted formula, caps K and A, and covers the range', () => {
  assert.equal(calculateFragScore({ kd: 1.2, adr: 84, winRate: 60, hs: 50 }), 62);
  assert.equal(calculateFragScore({ kd: 0, adr: 0, winRate: 0, hs: 0 }), 0);
  assert.equal(calculateFragScore({ kd: 2, adr: 120, winRate: 100, hs: 100 }), 100);
  assert.equal(calculateFragScore({ kd: 4, adr: 240, winRate: 100, hs: 100 }), 100);
  assert.deepEqual(calculatePlayerMetrics({ kills: 0, deaths: 0, rounds: 0, damage: 0, headshots: 0, matches: 0, wins: 0 }), { kd: 0, adr: 0, hs: 0, winRate: 0 });
  const noDeaths = calculatePlayerMetrics({ kills: 10, deaths: 0, rounds: 10, damage: 1000, headshots: 5, matches: 1, wins: 1 });
  assert.equal(noDeaths.kd, Infinity);
  assert.ok(Number.isFinite(calculateFragScore(noDeaths)));
});

test('the one dataset has unique identities and consistent counters and derived metrics', () => {
  assert.ok(players.length >= 25 && players.length <= 30);
  assert.equal(new Set(players.map((player) => player.id)).size, players.length);
  assert.equal(new Set(players.map((player) => player.nickname.toLowerCase())).size, players.length);
  assert.equal(demoPlayers, players);
  for (const player of players) {
    assert.ok(player.country && player.team && player.nickname);
    for (const key of ['matches', 'wins', 'kills', 'deaths', 'headshots', 'rounds', 'damage']) {
      assert.ok(Number.isInteger(player[key]) && player[key] >= 0, `${player.id}: ${key}`);
    }
    assert.ok(player.wins <= player.matches && player.headshots <= player.kills);
    assert.ok(player.deaths <= player.rounds && player.rounds >= player.matches * 13);
    assert.equal(player.kd, player.kills / player.deaths);
    assert.equal(player.adr, player.damage / player.rounds);
    assert.equal(player.hs, player.headshots / player.kills * 100);
    assert.equal(player.winRate, player.wins / player.matches * 100);
    const expected = 0.35 * Math.min(player.kd / 2, 1) * 100
      + 0.30 * Math.min(player.adr / 120, 1) * 100 + 0.25 * player.winRate + 0.10 * player.hs;
    assert.ok(Math.abs(calculateFragScore(player) - expected) < 1e-10);
    assert.ok(expected >= 0 && expected <= 100);
  }
  for (const team of new Set(players.map((player) => player.team))) {
    const teammates = players.filter((player) => player.team === team);
    assert.equal(teammates.length, 5);
    assert.equal(new Set(teammates.map((player) => `${player.matches}/${player.wins}/${player.rounds}`)).size, 1);
  }
});

test('ranking uses full precision, preserves the source, and breaks ties consistently', () => {
  const original = JSON.stringify(players);
  const ranked = rankPlayers(players);
  assert.equal(JSON.stringify(players), original);
  ranked.forEach((player, index) => {
    assert.equal(player.position, index + 1);
    if (index) assert.ok(ranked[index - 1].fragScore >= player.fragScore);
  });
  assert.equal(ranked[0].id, 'donk');
  assert.equal(ranked[0].fragScore, 73.75);
  const tied = rankPlayers([
    { id: 'b', nickname: 'Beta', kd: 1, adr: 80, hs: 50, winRate: 60 },
    { id: 'a', nickname: 'Alpha', kd: 1, adr: 80, hs: 50, winRate: 60 },
  ]);
  assert.deepEqual(tied.map((player) => player.id), ['a', 'b']);
});

test('homepage summary is derived from the complete dataset', () => {
  const summary = summarizePlayers(players);
  assert.equal(summary.players, 30);
  assert.equal(summary.teams, 6);
  const expectedAverage = rankPlayers(players).reduce((sum, player) => sum + player.fragScore, 0) / players.length;
  assert.ok(Math.abs(summary.averageFragScore - expectedAverage) < 1e-10);
  assert.deepEqual(summarizePlayers([]), { players: 0, teams: 0, averageFragScore: 0 });
});
