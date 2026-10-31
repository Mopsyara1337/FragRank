// Compatibility exports only. The original fictional dataset has been removed.
// New pages should import players.js and metrics.js directly.
import { players } from './players.js';
import { summarizePlayers } from './metrics.js';

export { players as demoPlayers };
export const demoSummary = summarizePlayers(players);
