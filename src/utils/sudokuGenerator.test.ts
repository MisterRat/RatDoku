import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { findSmartHint, generateSudokuPuzzle } from './sudokuGenerator';
import type { Difficulty } from '../types';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const PUZZLES_PER_DIFFICULTY = 8;

// Clue targets from DIFFICULTY_CONFIG in sudokuGenerator.ts. The generator stops removing
// clues at the target, and keeps more only when no further removal is allowed.
const TARGET_CLUES: Record<Difficulty, number> = { easy: 38, medium: 32, hard: 27 };
const MAX_CLUES: Record<Difficulty, number> = { easy: 45, medium: 40, hard: 36 };

/** Independent brute-force solver: counts solutions, stopping at `limit`. */
function countSolutions(grid: number[][], limit = 2): number {
  const g = grid.map((row) => [...row]);
  let count = 0;
  const ok = (r: number, c: number, n: number) => {
    for (let i = 0; i < 9; i++) {
      if (g[r][i] === n || g[i][c] === n) return false;
      const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const bc = 3 * Math.floor(c / 3) + (i % 3);
      if (g[br][bc] === n) return false;
    }
    return true;
  };
  const solve = (): void => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] !== 0) continue;
        for (let n = 1; n <= 9 && count < limit; n++) {
          if (ok(r, c, n)) {
            g[r][c] = n;
            solve();
            g[r][c] = 0;
          }
        }
        return;
      }
    }
    count++;
  };
  solve();
  return count;
}

function isValidSolution(grid: number[][]): boolean {
  const full = '123456789';
  for (let i = 0; i < 9; i++) {
    const row = grid[i];
    const col = grid.map((r) => r[i]);
    const box = Array.from({ length: 9 }, (_, k) => grid[3 * Math.floor(i / 3) + Math.floor(k / 3)][3 * (i % 3) + (k % 3)]);
    for (const unit of [row, col, box]) {
      if ([...unit].sort().join('') !== full) return false;
    }
  }
  return true;
}

const clueCount = (grid: number[][]) => grid.flat().filter((v) => v !== 0).length;

describe.each(DIFFICULTIES)('%s puzzles', (difficulty) => {
  const puzzles = Array.from({ length: PUZZLES_PER_DIFFICULTY }, () => generateSudokuPuzzle(difficulty));

  it('have a valid, fully solved solution grid', () => {
    for (const p of puzzles) expect(isValidSolution(p.solutionGrid)).toBe(true);
  });

  it('only show clues that match the solution', () => {
    for (const p of puzzles) {
      p.initialGrid.forEach((row, r) =>
        row.forEach((v, c) => {
          if (v !== 0) expect(v).toBe(p.solutionGrid[r][c]);
        })
      );
    }
  });

  it('have exactly one solution', () => {
    for (const p of puzzles) expect(countSolutions(p.initialGrid)).toBe(1);
  });

  it('have the expected number of clues', () => {
    for (const p of puzzles) {
      const clues = clueCount(p.initialGrid);
      expect(clues).toBeGreaterThanOrEqual(TARGET_CLUES[difficulty]);
      expect(clues).toBeLessThanOrEqual(MAX_CLUES[difficulty]);
    }
  });
});

describe('daily challenges', () => {
  it('give the same grid for the same date and difficulty', () => {
    for (const d of DIFFICULTIES) {
      const a = generateSudokuPuzzle(d, 'daily', '2026-10-18');
      const b = generateSudokuPuzzle(d, 'daily', '2026-10-18');
      expect(a.initialGrid).toEqual(b.initialGrid);
      expect(a.solutionGrid).toEqual(b.solutionGrid);
      expect(a.id).toBe(`daily-2026-10-18-${d}`);
    }
  });

  it('differ between dates and between difficulties', () => {
    const today = generateSudokuPuzzle('medium', 'daily', '2026-10-18');
    const tomorrow = generateSudokuPuzzle('medium', 'daily', '2026-10-19');
    const todayHard = generateSudokuPuzzle('hard', 'daily', '2026-10-18');
    expect(today.solutionGrid).not.toEqual(tomorrow.solutionGrid);
    expect(today.initialGrid).not.toEqual(todayHard.initialGrid);
  });

  // Guards against accidental changes to the generator: every player must get the same
  // daily puzzle, so any change here alters past and future daily challenges.
  it('match the published daily puzzles', () => {
    const fingerprint = DIFFICULTIES.map((d) => {
      const p = generateSudokuPuzzle(d, 'daily', '2026-01-01');
      return `${d}:${p.initialGrid.flat().join('')}`;
    }).join('|');
    expect(createHash('sha256').update(fingerprint).digest('hex').slice(0, 16)).toMatchInlineSnapshot(`"99062ff9df0ca7d8"`);
  });
});

describe('smart hint for a wrong entry', () => {
  const puzzle = generateSudokuPuzzle('easy', 'daily', '2026-10-18');

  const firstEmptyCell = () => {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (puzzle.initialGrid[r][c] === 0) return [r, c] as const;
    throw new Error('puzzle has no empty cells');
  };

  it('calls it a conflict when the number repeats in its row, column or box', () => {
    const [r, c] = firstEmptyCell();
    const grid = puzzle.initialGrid.map((row) => [...row]);
    // Any clue already in the same row is guaranteed to clash.
    grid[r][c] = grid[r].find((v) => v !== 0)!;
    const hint = findSmartHint(grid, puzzle.solutionGrid);
    expect(hint?.title).toBe('Conflict Detected');
    expect([hint?.row, hint?.col]).toEqual([r, c]);
  });

  it('calls it incorrect when the number breaks no rule but is not the solution', () => {
    const [r, c] = firstEmptyCell();
    const grid = puzzle.initialGrid.map((row) => [...row]);
    const legalWrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => {
      if (n === puzzle.solutionGrid[r][c]) return false;
      for (let i = 0; i < 9; i++) {
        if (grid[r][i] === n || grid[i][c] === n) return false;
        if (grid[3 * Math.floor(r / 3) + Math.floor(i / 3)][3 * Math.floor(c / 3) + (i % 3)] === n) return false;
      }
      return true;
    });
    if (legalWrong === undefined) return; // cell has a single candidate; nothing to test here
    grid[r][c] = legalWrong;
    const hint = findSmartHint(grid, puzzle.solutionGrid);
    expect(hint?.title).toBe('Incorrect Entry');
    expect(hint?.explanation).not.toMatch(/repeats/);
  });
});
