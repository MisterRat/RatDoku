// Standalone RatDoku.html build: the puzzle generator is embedded in the page itself.
import PuzzleWorker from './puzzle.worker.ts?worker&inline';

export function createPuzzleWorker(): Worker {
  return new PuzzleWorker();
}
