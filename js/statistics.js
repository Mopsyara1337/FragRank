// Pure aggregation over the shared player dataset. No statistics are stored here.
export const KD_RANGES = Object.freeze([
  { label: 'Менее 1,00', interval: '0 ≤ K/D < 1,00', minimum: 0, maximum: 1 },
  { label: 'От 1,00 до 1,19', interval: '1,00 ≤ K/D < 1,20', minimum: 1, maximum: 1.2 },
  { label: 'От 1,20 до 1,39', interval: '1,20 ≤ K/D < 1,40', minimum: 1.2, maximum: 1.4 },
  { label: 'От 1,40 до 1,59', interval: '1,40 ≤ K/D < 1,60', minimum: 1.4, maximum: 1.6 },
  { label: 'От 1,60 и выше', interval: 'K/D ≥ 1,60', minimum: 1.6, maximum: Infinity },
].map(Object.freeze));

export function getKDBucketIndex(kd) {
  return KD_RANGES.findIndex((range) => kd >= range.minimum
    && (range.maximum === Infinity || kd < range.maximum));
}

export function getKDDistribution(players) {
  const groups = KD_RANGES.map((range) => ({ ...range, count: 0 }));
  players.forEach((player) => {
    const index = getKDBucketIndex(player.kd);
    if (index < 0) throw new RangeError(`Некорректный K/D игрока ${player.id}`);
    groups[index].count += 1;
  });
  return groups.map((group) => ({
    ...group,
    percentage: players.length ? group.count / players.length * 100 : 0,
  }));
}

export function countPlayersBy(players, key) {
  const counts = new Map();
  players.forEach((player) => counts.set(player[key], (counts.get(player[key]) || 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count, percentage: count / players.length * 100 }));
}

export function sortGroups(groups, direction = 'desc') {
  return [...groups].sort((a, b) => (direction === 'asc' ? a.count - b.count : b.count - a.count)
    || a.name.localeCompare(b.name, 'ru'));
}

export function buildStatistics(players) {
  const countries = countPlayersBy(players, 'country');
  const teams = countPlayersBy(players, 'team');
  const mean = (key) => players.length
    ? players.reduce((sum, player) => sum + player[key], 0) / players.length : 0;
  return {
    summary: {
      players: players.length,
      teams: teams.length,
      countries: countries.length,
      averageKD: mean('kd'),
      averageADR: mean('adr'),
      averageWinRate: mean('winRate'),
    },
    countries,
    teams,
    kdDistribution: getKDDistribution(players),
  };
}

// Receives records already enriched by rankPlayers(); FragScore is not recalculated.
export function getTopPlayers(rankedPlayers, metric, limit = 10) {
  return [...rankedPlayers]
    .sort((a, b) => b[metric] - a[metric] || a.position - b.position)
    .slice(0, limit);
}
