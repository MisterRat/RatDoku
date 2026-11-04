// Regular build: the puzzle generator is a separate file next to the page.
// (The standalone RatDoku.html build swaps this for createPuzzleWorker.single.ts; see vite.config.ts.)
export function createPuzzleWorker(): Worker {
  return new Worker(new URL('./puzzle.worker.ts', import.meta.url), { type: 'module' });
}
