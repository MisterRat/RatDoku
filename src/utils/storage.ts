import {
  DailyCompletionRecord,
  Difficulty,
  GameSettings,
  OverallStats,
  SavedGameState,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'sudoku_settings_v1',
  STATS: 'sudoku_stats_v1',
  SAVED_GAME: 'sudoku_active_game_v1',
  DAILY_RECORDS: 'sudoku_daily_records_v1',
};

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  autoRemoveNotes: true,
  highlightDuplicates: true,
  highlightMatchingNumbers: true,
  highlightPeers: true,
  errorLimit: null, // Unlimited by default
  theme: 'elegant-dark',
  language: 'auto', // follow the device language until the player picks one
};

const DEFAULT_DIFF_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestTime: null,
  totalTime: 0,
  averageTime: null,
  currentStreak: 0,
  bestStreak: 0,
};

export const DEFAULT_STATS: OverallStats = {
  easy: { ...DEFAULT_DIFF_STATS },
  medium: { ...DEFAULT_DIFF_STATS },
  hard: { ...DEFAULT_DIFF_STATS },
  dailyStreak: 0,
  lastDailyDateCompleted: null,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadStats(): OverallStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: OverallStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function recordGameWin(
  difficulty: Difficulty,
  timeSeconds: number,
  isDaily: boolean,
  dateKey?: string,
  hintsUsed = 0
): OverallStats {
  const currentStats = loadStats();
  const diffStat = currentStats[difficulty];

  diffStat.gamesPlayed += 1;
  diffStat.gamesWon += 1;
  diffStat.totalTime += timeSeconds;
  diffStat.averageTime = Math.round(diffStat.totalTime / diffStat.gamesWon);
  if (diffStat.bestTime === null || timeSeconds < diffStat.bestTime) {
    diffStat.bestTime = timeSeconds;
  }
  diffStat.currentStreak += 1;
  if (diffStat.currentStreak > diffStat.bestStreak) {
    diffStat.bestStreak = diffStat.currentStreak;
  }

  // Handle Daily streak
  if (isDaily && dateKey) {
    recordDailyCompletion(dateKey, difficulty, timeSeconds, hintsUsed);

    const todayStr = getTodayDateKey();
    if (dateKey === todayStr) {
      if (currentStats.lastDailyDateCompleted !== todayStr) {
        const yesterdayStr = getYesterdayDateKey();
        if (currentStats.lastDailyDateCompleted === yesterdayStr) {
          currentStats.dailyStreak += 1;
        } else if (!currentStats.lastDailyDateCompleted) {
          currentStats.dailyStreak = 1;
        } else {
          currentStats.dailyStreak = 1;
        }
        currentStats.lastDailyDateCompleted = todayStr;
      }
    }
  }

  saveStats(currentStats);
  return currentStats;
}

export function loadDailyRecords(): Record<string, DailyCompletionRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function recordDailyCompletion(
  date: string,
  difficulty: Difficulty,
  timeSeconds: number,
  hintsUsed: number
): void {
  const records = loadDailyRecords();
  const key = `${date}-${difficulty}`;
  records[key] = {
    date,
    difficulty,
    completed: true,
    timeSeconds,
    hintsUsed,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save daily record', e);
  }
}

export function isDailyCompleted(date: string, difficulty: Difficulty): boolean {
  const records = loadDailyRecords();
  return Boolean(records[`${date}-${difficulty}`]?.completed);
}

export function loadSavedGame(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_GAME);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveGame(state: SavedGameState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
    } else {
      localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to save active game', e);
  }
}

// Date helpers
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
