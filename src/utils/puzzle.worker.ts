/// <reference lib="webworker" />
// Runs the puzzle generator off the main thread so starting a Hard game
// never freezes the UI on slower phones.
import { generateSudokuPuzzle } from './sudokuGenerator';
import type { Difficulty, GameMode } from '../types';

export interface PuzzleRequest {
  id: number;
  difficulty: Difficulty;
  mode: GameMode;
  dateKey?: string;
}

self.onmessage = (event: MessageEvent<PuzzleRequest>) => {
  const { id, difficulty, mode, dateKey } = event.data;
  try {
    const puzzle = generateSudokuPuzzle(difficulty, mode, dateKey);
    self.postMessage({ id, puzzle });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
