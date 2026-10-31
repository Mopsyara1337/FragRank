import { calculatePlayerMetrics } from './metrics.js';

// The only source of player data. Nicknames/countries are real.
// Teams are a historical snapshot: Shanghai Major, December 2024 (see README).
// ALL numerical values are invented for this educational project.
// matches = maps played; rounds = rounds played; damage = total damage dealt.
// Teammates have the same demo schedule; no actual match records are implied.
export const players = Object.freeze([
  {
    id: 'donk', nickname: 'donk', country: 'Россия', team: 'Team Spirit',
    matches: 50, wins: 35, kills: 1050, deaths: 700, headshots: 630, rounds: 1100, damage: 105600,
  },
  {
    id: 'sh1ro', nickname: 'sh1ro', country: 'Россия', team: 'Team Spirit',
    matches: 50, wins: 35, kills: 900, deaths: 625, headshots: 270, rounds: 1100, damage: 90200,
  },
  {
    id: 'chopper', nickname: 'chopper', country: 'Россия', team: 'Team Spirit',
    matches: 50, wins: 35, kills: 650, deaths: 780, headshots: 325, rounds: 1100, damage: 69300,
  },
  {
    id: 'magixx', nickname: 'magixx', country: 'Россия', team: 'Team Spirit',
    matches: 50, wins: 35, kills: 750, deaths: 735, headshots: 405, rounds: 1100, damage: 79200,
  },
  {
    id: 'zont1x', nickname: 'zont1x', country: 'Украина', team: 'Team Spirit',
    matches: 50, wins: 35, kills: 800, deaths: 740, headshots: 360, rounds: 1100, damage: 83600,
  },
  {
    id: 'zywoo', nickname: 'ZywOo', country: 'Франция', team: 'Team Vitality',
    matches: 50, wins: 34, kills: 1000, deaths: 670, headshots: 420, rounds: 1120, damage: 105280,
  },
  {
    id: 'apex', nickname: 'apEX', country: 'Франция', team: 'Team Vitality',
    matches: 50, wins: 34, kills: 675, deaths: 820, headshots: 351, rounds: 1120, damage: 76160,
  },
  {
    id: 'flamez', nickname: 'flameZ', country: 'Израиль', team: 'Team Vitality',
    matches: 50, wins: 34, kills: 850, deaths: 760, headshots: 510, rounds: 1120, damage: 94080,
  },
  {
    id: 'spinx', nickname: 'Spinx', country: 'Израиль', team: 'Team Vitality',
    matches: 50, wins: 34, kills: 875, deaths: 730, headshots: 490, rounds: 1120, damage: 95200,
  },
  {
    id: 'mezii', nickname: 'mezii', country: 'Великобритания', team: 'Team Vitality',
    matches: 50, wins: 34, kills: 725, deaths: 750, headshots: 406, rounds: 1120, damage: 81760,
  },
  {
    id: 'monesy', nickname: 'm0NESY', country: 'Россия', team: 'G2 Esports',
    matches: 48, wins: 32, kills: 1000, deaths: 660, headshots: 400, rounds: 1060, damage: 98580,
  },
  {
    id: 'niko', nickname: 'NiKo', country: 'Босния и Герцеговина', team: 'G2 Esports',
    matches: 48, wins: 32, kills: 950, deaths: 710, headshots: 646, rounds: 1060, damage: 99640,
  },
  {
    id: 'hunter', nickname: 'huNter-', country: 'Босния и Герцеговина', team: 'G2 Esports',
    matches: 48, wins: 32, kills: 800, deaths: 750, headshots: 456, rounds: 1060, damage: 83740,
  },
  {
    id: 'malbsmd', nickname: 'malbsMd', country: 'Гватемала', team: 'G2 Esports',
    matches: 48, wins: 32, kills: 875, deaths: 735, headshots: 560, rounds: 1060, damage: 93280,
  },
  {
    id: 'snax', nickname: 'Snax', country: 'Польша', team: 'G2 Esports',
    matches: 48, wins: 32, kills: 625, deaths: 785, headshots: 300, rounds: 1060, damage: 67840,
  },
  {
    id: 'b1t', nickname: 'b1t', country: 'Украина', team: 'Natus Vincere',
    matches: 52, wins: 33, kills: 900, deaths: 775, headshots: 648, rounds: 1160, damage: 97440,
  },
  {
    id: 'jl', nickname: 'jL', country: 'Литва', team: 'Natus Vincere',
    matches: 52, wins: 33, kills: 900, deaths: 760, headshots: 540, rounds: 1160, damage: 99760,
  },
  {
    id: 'im', nickname: 'iM', country: 'Румыния', team: 'Natus Vincere',
    matches: 52, wins: 33, kills: 850, deaths: 810, headshots: 527, rounds: 1160, damage: 95120,
  },
  {
    id: 'aleksib', nickname: 'Aleksib', country: 'Финляндия', team: 'Natus Vincere',
    matches: 52, wins: 33, kills: 700, deaths: 840, headshots: 350, rounds: 1160, damage: 76560,
  },
  {
    id: 'wonderful', nickname: 'w0nderful', country: 'Украина', team: 'Natus Vincere',
    matches: 52, wins: 33, kills: 875, deaths: 710, headshots: 315, rounds: 1160, damage: 92800,
  },
  {
    id: 'ropz', nickname: 'ropz', country: 'Эстония', team: 'FaZe Clan',
    matches: 50, wins: 30, kills: 900, deaths: 730, headshots: 558, rounds: 1140, damage: 99180,
  },
  {
    id: 'frozen', nickname: 'frozen', country: 'Словакия', team: 'FaZe Clan',
    matches: 50, wins: 30, kills: 850, deaths: 745, headshots: 493, rounds: 1140, damage: 93480,
  },
  {
    id: 'broky', nickname: 'broky', country: 'Латвия', team: 'FaZe Clan',
    matches: 50, wins: 30, kills: 875, deaths: 700, headshots: 315, rounds: 1140, damage: 90060,
  },
  {
    id: 'rain', nickname: 'rain', country: 'Норвегия', team: 'FaZe Clan',
    matches: 50, wins: 30, kills: 825, deaths: 820, headshots: 495, rounds: 1140, damage: 91200,
  },
  {
    id: 'karrigan', nickname: 'karrigan', country: 'Дания', team: 'FaZe Clan',
    matches: 50, wins: 30, kills: 650, deaths: 865, headshots: 325, rounds: 1140, damage: 75240,
  },
  {
    id: 'torzsi', nickname: 'torzsi', country: 'Венгрия', team: 'MOUZ',
    matches: 46, wins: 29, kills: 825, deaths: 660, headshots: 264, rounds: 1020, damage: 82620,
  },
  {
    id: 'xertion', nickname: 'xertioN', country: 'Израиль', team: 'MOUZ',
    matches: 46, wins: 29, kills: 850, deaths: 740, headshots: 527, rounds: 1020, damage: 90780,
  },
  {
    id: 'jimpphat', nickname: 'Jimpphat', country: 'Финляндия', team: 'MOUZ',
    matches: 46, wins: 29, kills: 800, deaths: 675, headshots: 464, rounds: 1020, damage: 83640,
  },
  {
    id: 'brollan', nickname: 'Brollan', country: 'Швеция', team: 'MOUZ',
    matches: 46, wins: 29, kills: 775, deaths: 730, headshots: 465, rounds: 1020, damage: 82620,
  },
  {
    id: 'siuhy', nickname: 'siuhy', country: 'Польша', team: 'MOUZ',
    matches: 46, wins: 29, kills: 650, deaths: 765, headshots: 338, rounds: 1020, damage: 68340,
  },
].map((player) => Object.freeze({ ...player, ...calculatePlayerMetrics(player) })));
