import type { LanguageSetting } from './i18n/languages';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'daily';

export type ThemeMode = 'elegant-dark' | 'minimal-light' | 'warm-paper' | 'dark-slate' | 'nordic-forest';

export interface CellData {
  row: number;
  col: number;
  value: number; // 0 = empty, 1-9 = filled
  solutionValue: number;
  isInitial: boolean;
  notes: number[]; // Candidate values 1-9
  isError?: boolean;
}

export type BoardMatrix = CellData[][];

export interface SudokuPuzzle {
  id: string;
  difficulty: Difficulty;
  mode: GameMode;
  dateKey?: string; // YYYY-MM-DD if daily
  initialGrid: number[][]; // 9x9 matrix of 0-9
  solutionGrid: number[][]; // 9x9 matrix of 1-9
  seed?: number;
}

export interface MoveStep {
  row: number;
  col: number;
  prevValue: number;
  newValue: number;
  prevNotes: number[];
  newNotes: number[];
  affectedNotes?: { row: number; col: number; prevNotes: number[]; newNotes: number[] }[];
}

export interface HintHighlight {
  row: number;
  col: number;
  type: 'target' | 'peer' | 'cause';
  label?: string;
}

export type HintMessageId =
  | 'conflict'
  | 'incorrect'
  | 'keyCellBox'
  | 'keyCellRow'
  | 'keyCellCol'
  | 'lockedRow'
  | 'lockedCol'
  | 'opportunity'
  | 'singleRow'
  | 'singleCol'
  | 'singleBox'
  | 'nakedSingle';

export interface HintInfo {
  type:
    | 'naked_single'
    | 'hidden_single'
    | 'only_square'
    | 'rule_elimination'
    | 'locked_candidates'
    | 'naked_pair'
    | 'hidden_pair'
    | 'x_wing';
  row: number;
  col: number;
  suggestedValue: number;
  title: string;
  explanation: string;
  technique: string;
  /** Language-neutral message ID + numbers, used to show the hint in the player's language. */
  messageId: HintMessageId;
  params: Record<string, number>;
  highlights: HintHighlight[];
}

export interface DifficultyStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number | null; // seconds
  totalTime: number; // seconds
  averageTime: number | null; // seconds
  currentStreak: number;
  bestStreak: number;
}

export interface OverallStats {
  easy: DifficultyStats;
  medium: DifficultyStats;
  hard: DifficultyStats;
  dailyStreak: number;
  lastDailyDateCompleted: string | null;
}

export interface DailyCompletionRecord {
  date: string; // YYYY-MM-DD
  difficulty: Difficulty;
  completed: boolean;
  timeSeconds: number;
  hintsUsed: number;
  timestamp: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  autoRemoveNotes: boolean;
  highlightDuplicates: boolean;
  highlightMatchingNumbers: boolean;
  highlightPeers: boolean;
  errorLimit: number | null; // null = unlimited, or 3
  theme: ThemeMode;
  /** 'auto' follows the device language; otherwise a code from src/i18n/languages.ts. */
  language: LanguageSetting;
}

export interface SavedGameState {
  puzzle: SudokuPuzzle;
  board: {
    row: number;
    col: number;
    value: number;
    notes: number[];
    isInitial: boolean;
    isError?: boolean;
  }[][];
  timerSeconds: number;
  isPaused: boolean;
  isComplete: boolean;
  mistakesCount: number;
  hintsCount: number;
  difficulty: Difficulty;
  mode: GameMode;
  dateKey?: string;
}
