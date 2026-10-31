// Pure calculations shared by every page. Round only when displaying values.
export function calculatePlayerMetrics({ kills, deaths, rounds, damage, headshots, matches, wins }) {
  return {
    kd: deaths > 0 ? kills / deaths : (kills > 0 ? Infinity : 0),
    adr: rounds > 0 ? damage / rounds : 0,
    hs: kills > 0 ? headshots / kills * 100 : 0,
    winRate: matches > 0 ? wins / matches * 100 : 0,
  };
}

/** FragScore: 0–100. Percentages use the 0–100 scale, not fractions. */
export function calculateFragScore({ kd, adr, winRate, hs }) {
  const K = Math.min(Math.max(kd, 0) / 2, 1) * 100;
  const A = Math.min(Math.max(adr, 0) / 120, 1) * 100;
  const W = Math.min(Math.max(winRate, 0), 100);
  const H = Math.min(Math.max(hs, 0), 100);
  return 0.35 * K + 0.30 * A + 0.25 * W + 0.10 * H;
}

/** New array; original data is never sorted or changed in place. */
export function rankPlayers(players) {
  return players
    .map((player) => ({ ...player, fragScore: calculateFragScore(player) }))
    .sort((a, b) => b.fragScore - a.fragScore
      || a.nickname.localeCompare(b.nickname, 'en', { sensitivity: 'base' })
      || a.id.localeCompare(b.id))
    .map((player, index) => ({ ...player, position: index + 1 }));
}

export function summarizePlayers(players) {
  return {
    players: players.length,
    teams: new Set(players.map((player) => player.team)).size,
    averageFragScore: players.length
      ? players.reduce((sum, player) => sum + calculateFragScore(player), 0) / players.length
      : 0,
  };
}
