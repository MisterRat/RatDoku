import type { Difficulty, GameMode, SudokuPuzzle } from '../types';
import { generateSudokuPuzzle } from './sudokuGenerator';
import type { PuzzleRequest } from './puzzle.worker';

type Pending = {
  resolve: (p: SudokuPuzzle) => void;
  fallback: () => void;
};

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;
const pending = new Map<number, Pending>();

function failAll() {
  workerBroken = true;
  worker?.terminate();
  worker = null;
  const waiting = Array.from(pending.values());
  pending.clear();
  waiting.forEach((p) => p.fallback());
}

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === 'undefined') return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./puzzle.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; puzzle?: SudokuPuzzle; error?: string }>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      if (event.data.puzzle) entry.resolve(event.data.puzzle);
      else entry.fallback();
    };
    // Script failed to load (e.g. offline before it was cached): fall back to the main thread.
    worker.onerror = () => failAll();
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

/** Create the worker early so its script is fetched (and cached for offline) on first visit. */
export function warmUpPuzzleWorker(): void {
  getWorker();
}

/**
 * Generates a puzzle in a Web Worker when available, otherwise on the main thread.
 * Produces exactly the same grid as generateSudokuPuzzle for the same inputs.
 */
export function generatePuzzleAsync(
  difficulty: Difficulty,
  mode: GameMode,
  dateKey?: string
): Promise<SudokuPuzzle> {
  return new Promise((resolve) => {
    const runInline = () => {
      // Yield a frame so the loading indicator can paint before the CPU-heavy work.
      setTimeout(() => resolve(generateSudokuPuzzle(difficulty, mode, dateKey)), 0);
    };
    const w = getWorker();
    if (!w) {
      runInline();
      return;
    }
    const id = nextId++;
    pending.set(id, { resolve, fallback: runInline });
    const request: PuzzleRequest = { id, difficulty, mode, dateKey };
    w.postMessage(request);
  });
}
