import { Difficulty, GameMode, HintHighlight, HintInfo, SudokuPuzzle } from '../types';

// Seeded PRNG (Mulberry32)
export function createPRNG(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert a string (e.g. "2026-08-23-easy") to a numeric 32-bit seed
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Helper to shuffle an array using a given random generator
function shuffle<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Check if placing num at (row, col) is valid on the grid
export function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currR = startRow + r;
      const currC = startCol + c;
      if ((currR !== row || currC !== col) && grid[currR][currC] === num) {
        return false;
      }
    }
  }

  return true;
}

// Solve Sudoku with randomized backtracking to generate full valid boards
function solveGrid(grid: number[][], rng: () => number = Math.random): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
        for (const num of nums) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveGrid(grid, rng)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count solutions to ensure unique solution (stops early if count > 1)
function countSolutions(grid: number[][], count = { total: 0 }): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num;
            countSolutions(grid, count);
            grid[r][c] = 0;
            if (count.total >= 2) return count.total;
          }
        }
        return count.total;
      }
    }
  }
  count.total++;
  return count.total;
}

// Generate a complete solved 9x9 grid
export function generateFullSolvedBoard(rng: () => number = Math.random): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveGrid(grid, rng);
  return grid;
}

// Calculate available candidate numbers for a specific cell
export function getPossibleCandidates(grid: number[][], row: number, col: number): number[] {
  if (grid[row][col] !== 0) return [];
  const candidates: number[] = [];
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      candidates.push(num);
    }
  }
  return candidates;
}

// Helper: Get all [row, col] coords in a 3x3 box (index 0..8)
export function getBoxCoordinates(boxIndex: number): [number, number][] {
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  const coords: [number, number][] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      coords.push([startRow + r, startCol + c]);
    }
  }
  return coords;
}

// Helper: Get all row coords [row, col]
export function getRowCoordinates(row: number): [number, number][] {
  return Array.from({ length: 9 }, (_, c) => [row, c]);
}

// Helper: Get all column coords [row, col]
export function getColCoordinates(col: number): [number, number][] {
  return Array.from({ length: 9 }, (_, r) => [r, col]);
}

/**
 * HUMAN-LOGIC SOLVER & VERIFIER
 * Determines if a puzzle can be solved step-by-step strictly using human deduction techniques
 * without any guessing or backtracking.
 */
export function isLogicallySolvable(grid: number[][], difficulty: Difficulty): boolean {
  // Initialize candidates matrix (Set of numbers 1-9 for each cell)
  const candidates: Set<number>[][] = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      if (grid[r][c] !== 0) return new Set<number>();
      return new Set(getPossibleCandidates(grid, r, c));
    })
  );

  const workGrid = grid.map((row) => [...row]);
  let emptyCellsCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (workGrid[r][c] === 0) emptyCellsCount++;
    }
  }

  const eliminateCandidate = (r: number, c: number, num: number): boolean => {
    if (candidates[r][c].has(num)) {
      candidates[r][c].delete(num);
      return true;
    }
    return false;
  };

  const placeNumber = (r: number, c: number, num: number) => {
    workGrid[r][c] = num;
    candidates[r][c].clear();
    emptyCellsCount--;

    // Eliminate from row
    for (let col = 0; col < 9; col++) {
      eliminateCandidate(r, col, num);
    }
    // Eliminate from column
    for (let row = 0; row < 9; row++) {
      eliminateCandidate(row, c, num);
    }
    // Eliminate from box
    const startRow = Math.floor(r / 3) * 3;
    const startCol = Math.floor(c / 3) * 3;
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        eliminateCandidate(startRow + br, startCol + bc, num);
      }
    }
  };

  // Main deduction loop
  while (emptyCellsCount > 0) {
    let progress = false;

    // 1. Technique: Naked Singles (Cell has only 1 remaining candidate)
    for (let r = 0; r < 9 && !progress; r++) {
      for (let c = 0; c < 9 && !progress; c++) {
        if (workGrid[r][c] === 0 && candidates[r][c].size === 1) {
          const val = Array.from(candidates[r][c])[0];
          placeNumber(r, c, val);
          progress = true;
        }
      }
    }
    if (progress) continue;

    // 2. Technique: Hidden Singles (Candidate appears in only 1 cell in a Row, Column, or Box)
    // 2a. Rows
    for (let r = 0; r < 9 && !progress; r++) {
      for (let num = 1; num <= 9 && !progress; num++) {
        const matchingCols: number[] = [];
        for (let c = 0; c < 9; c++) {
          if (workGrid[r][c] === 0 && candidates[r][c].has(num)) {
            matchingCols.push(c);
          }
        }
        if (matchingCols.length === 1) {
          placeNumber(r, matchingCols[0], num);
          progress = true;
        }
      }
    }
    if (progress) continue;

    // 2b. Columns
    for (let c = 0; c < 9 && !progress; c++) {
      for (let num = 1; num <= 9 && !progress; num++) {
        const matchingRows: number[] = [];
        for (let r = 0; r < 9; r++) {
          if (workGrid[r][c] === 0 && candidates[r][c].has(num)) {
            matchingRows.push(r);
          }
        }
        if (matchingRows.length === 1) {
          placeNumber(matchingRows[0], c, num);
          progress = true;
        }
      }
    }
    if (progress) continue;

    // 2c. Boxes
    for (let b = 0; b < 9 && !progress; b++) {
      const boxCoords = getBoxCoordinates(b);
      for (let num = 1; num <= 9 && !progress; num++) {
        const matchingCells: [number, number][] = [];
        for (const [r, c] of boxCoords) {
          if (workGrid[r][c] === 0 && candidates[r][c].has(num)) {
            matchingCells.push([r, c]);
          }
        }
        if (matchingCells.length === 1) {
          placeNumber(matchingCells[0][0], matchingCells[0][1], num);
          progress = true;
        }
      }
    }
    if (progress) continue;

    // For 'easy' difficulty, we strictly require it to be solvable with Singles ONLY.
    if (difficulty === 'easy') {
      return false;
    }

    // 3. Technique: Locked Candidates 1 (Pointing Pairs/Triples)
    for (let b = 0; b < 9 && !progress; b++) {
      const boxCoords = getBoxCoordinates(b);
      for (let num = 1; num <= 9 && !progress; num++) {
        const numSpots = boxCoords.filter(([r, c]) => workGrid[r][c] === 0 && candidates[r][c].has(num));
        if (numSpots.length >= 2 && numSpots.length <= 3) {
          const sameRow = numSpots.every(([r]) => r === numSpots[0][0]);
          const sameCol = numSpots.every(([, c]) => c === numSpots[0][1]);

          if (sameRow) {
            const targetRow = numSpots[0][0];
            for (let c = 0; c < 9; c++) {
              if (Math.floor(c / 3) !== b % 3 && workGrid[targetRow][c] === 0) {
                if (eliminateCandidate(targetRow, c, num)) progress = true;
              }
            }
          } else if (sameCol) {
            const targetCol = numSpots[0][1];
            for (let r = 0; r < 9; r++) {
              if (Math.floor(r / 3) !== Math.floor(b / 3) && workGrid[r][targetCol] === 0) {
                if (eliminateCandidate(r, targetCol, num)) progress = true;
              }
            }
          }
        }
      }
    }
    if (progress) continue;

    // 4. Technique: Locked Candidates 2 (Claiming / Box-Line Reduction)
    for (let r = 0; r < 9 && !progress; r++) {
      for (let num = 1; num <= 9 && !progress; num++) {
        const spots = [];
        for (let c = 0; c < 9; c++) {
          if (workGrid[r][c] === 0 && candidates[r][c].has(num)) spots.push(c);
        }
        if (spots.length >= 2 && spots.length <= 3) {
          const firstBox = Math.floor(spots[0] / 3);
          if (spots.every((c) => Math.floor(c / 3) === firstBox)) {
            const boxIndex = Math.floor(r / 3) * 3 + firstBox;
            const boxCoords = getBoxCoordinates(boxIndex);
            for (const [br, bc] of boxCoords) {
              if (br !== r && workGrid[br][bc] === 0) {
                if (eliminateCandidate(br, bc, num)) progress = true;
              }
            }
          }
        }
      }
    }
    if (progress) continue;

    // 5. Technique: Naked Pairs in Rows, Columns, Boxes
    const units = [
      ...Array.from({ length: 9 }, (_, i) => getRowCoordinates(i)),
      ...Array.from({ length: 9 }, (_, i) => getColCoordinates(i)),
      ...Array.from({ length: 9 }, (_, i) => getBoxCoordinates(i)),
    ];

    for (const unit of units) {
      const pairCells = unit.filter(([r, c]) => workGrid[r][c] === 0 && candidates[r][c].size === 2);
      for (let i = 0; i < pairCells.length; i++) {
        for (let j = i + 1; j < pairCells.length; j++) {
          const [r1, c1] = pairCells[i];
          const [r2, c2] = pairCells[j];
          const set1 = candidates[r1][c1];
          const set2 = candidates[r2][c2];

          const arr1 = Array.from(set1);
          if (set2.size === 2 && set2.has(arr1[0]) && set2.has(arr1[1])) {
            const [val1, val2] = arr1;
            for (const [ur, uc] of unit) {
              if ((ur !== r1 || uc !== c1) && (ur !== r2 || uc !== c2) && workGrid[ur][uc] === 0) {
                if (eliminateCandidate(ur, uc, val1)) progress = true;
                if (eliminateCandidate(ur, uc, val2)) progress = true;
              }
            }
          }
        }
      }
      if (progress) break;
    }
    if (progress) continue;

    if (difficulty === 'medium') {
      return false;
    }

    // 6. Technique: X-Wing (for Hard puzzles)
    for (let num = 1; num <= 9 && !progress; num++) {
      const rowMatches: { row: number; cols: [number, number] }[] = [];
      for (let r = 0; r < 9; r++) {
        const cols: number[] = [];
        for (let c = 0; c < 9; c++) {
          if (workGrid[r][c] === 0 && candidates[r][c].has(num)) cols.push(c);
        }
        if (cols.length === 2) {
          rowMatches.push({ row: r, cols: [cols[0], cols[1]] });
        }
      }
      for (let i = 0; i < rowMatches.length; i++) {
        for (let j = i + 1; j < rowMatches.length; j++) {
          const r1 = rowMatches[i];
          const r2 = rowMatches[j];
          if (r1.cols[0] === r2.cols[0] && r1.cols[1] === r2.cols[1]) {
            const [c1, c2] = r1.cols;
            for (let r = 0; r < 9; r++) {
              if (r !== r1.row && r !== r2.row && workGrid[r][c1] === 0) {
                if (eliminateCandidate(r, c1, num)) progress = true;
              }
              if (r !== r1.row && r !== r2.row && workGrid[r][c2] === 0) {
                if (eliminateCandidate(r, c2, num)) progress = true;
              }
            }
          }
        }
      }
    }
    if (progress) continue;

    return false;
  }

  return emptyCellsCount === 0;
}

// Difficulty target clue counts
const DIFFICULTY_CONFIG: Record<Difficulty, { targetClues: number; minClues: number }> = {
  easy: { targetClues: 38, minClues: 36 },
  medium: { targetClues: 32, minClues: 30 },
  hard: { targetClues: 27, minClues: 24 },
};

/**
 * Generates a playable Sudoku puzzle guaranteed to have a UNIQUE solution
 * and to be 100% SOLVABLE BY HUMAN LOGIC (Zero Guessing).
 */
export function generateSudokuPuzzle(
  difficulty: Difficulty,
  mode: GameMode = 'classic',
  dateKey?: string
): SudokuPuzzle {
  const seed =
    mode === 'daily' && dateKey
      ? stringToSeed(`${dateKey}-${difficulty}`)
      : Math.floor(Math.random() * 1000000000);
  const rng = createPRNG(seed);

  const solutionGrid = generateFullSolvedBoard(rng);
  const puzzleGrid: number[][] = solutionGrid.map((row) => [...row]);

  // Create list of all 81 cell coordinates and shuffle
  const cells: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push([r, c]);
    }
  }
  const shuffledCells = shuffle(cells, rng);

  const config = DIFFICULTY_CONFIG[difficulty];
  let cluesCount = 81;

  for (const [r, c] of shuffledCells) {
    if (cluesCount <= config.targetClues) break;

    const temp = puzzleGrid[r][c];
    puzzleGrid[r][c] = 0;

    // Check 1: Unique solution
    const copyGrid = puzzleGrid.map((row) => [...row]);
    const solCount = countSolutions(copyGrid, { total: 0 });

    if (solCount === 1) {
      // Check 2: 100% Solvable by human deduction for this difficulty (No guessing)
      const solvableLogically = isLogicallySolvable(puzzleGrid, difficulty);

      if (solvableLogically) {
        cluesCount--;
        continue;
      }
    }

    // Revert if removal causes ambiguity or requires guessing
    puzzleGrid[r][c] = temp;
  }

  const id =
    mode === 'daily'
      ? `daily-${dateKey}-${difficulty}`
      : `puzzle-${Date.now()}-${Math.floor(rng() * 10000)}`;

  return {
    id,
    difficulty,
    mode,
    dateKey,
    initialGrid: puzzleGrid,
    solutionGrid,
    seed,
  };
}

/**
 * Intelligent Human-Logic Hint Engine
 * Guides the player on WHERE to look and WHAT technique to apply without giving away the final number.
 */
export function findSmartHint(
  currentGrid: number[][],
  solutionGrid: number[][],
  selectedRow: number | null = null,
  selectedCol: number | null = null
): HintInfo | null {
  // 1. Check for user errors (numbers conflicting with solution)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = currentGrid[r][c];
      if (val !== 0 && val !== solutionGrid[r][c]) {
        // Test the entry against its peers with the cell itself cleared.
        const withoutEntry = currentGrid.map((rowArr) => [...rowArr]);
        withoutEntry[r][c] = 0;
        const breaksRule = !isValidPlacement(withoutEntry, r, c, val);
        return {
          type: 'rule_elimination',
          row: r,
          col: c,
          suggestedValue: solutionGrid[r][c],
          title: breaksRule ? 'Conflict Detected' : 'Incorrect Entry',
          explanation: breaksRule
            ? `The ${val} at Row ${r + 1}, Column ${c + 1} repeats a number already in its row, column or box. Clearing this square will unlock the logical path.`
            : `The ${val} at Row ${r + 1}, Column ${c + 1} doesn't break any rule yet, but it isn't part of this puzzle's solution and will cause a contradiction later. Clearing this square will unlock the logical path.`,
          technique: breaksRule ? 'Conflict Resolution' : 'Error Check',
          highlights: [{ row: r, col: c, type: 'target' }],
        };
      }
    }
  }

  // 2. Check selected cell first (if user clicked on an empty cell)
  if (selectedRow !== null && selectedCol !== null && currentGrid[selectedRow][selectedCol] === 0) {
    const candidates = getPossibleCandidates(currentGrid, selectedRow, selectedCol);
    if (candidates.length === 1) {
      return buildNakedSingleHint(currentGrid, selectedRow, selectedCol, candidates[0]);
    }

    // Check if the selected cell is a Hidden Single in its row, col, or box
    const rowHidden = checkHiddenSingleInRow(currentGrid, selectedRow, selectedCol);
    if (rowHidden) return rowHidden;

    const colHidden = checkHiddenSingleInCol(currentGrid, selectedRow, selectedCol);
    if (colHidden) return colHidden;

    const boxHidden = checkHiddenSingleInBox(currentGrid, selectedRow, selectedCol);
    if (boxHidden) return boxHidden;
  }

  // 3. Search for Naked Singles across the board (easiest for players)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (currentGrid[r][c] === 0) {
        const candidates = getPossibleCandidates(currentGrid, r, c);
        if (candidates.length === 1) {
          return buildNakedSingleHint(currentGrid, r, c, candidates[0]);
        }
      }
    }
  }

  // 4. Search for Hidden Singles in 3x3 Boxes (most natural visual scan for humans)
  for (let b = 0; b < 9; b++) {
    const boxCoords = getBoxCoordinates(b);
    const boxNumber = b + 1;
    for (let num = 1; num <= 9; num++) {
      let alreadyInBox = false;
      const validSpots: [number, number][] = [];

      for (const [r, c] of boxCoords) {
        if (currentGrid[r][c] === num) {
          alreadyInBox = true;
          break;
        }
        if (currentGrid[r][c] === 0 && isValidPlacement(currentGrid, r, c, num)) {
          validSpots.push([r, c]);
        }
      }

      if (!alreadyInBox && validSpots.length === 1) {
        const [r, c] = validSpots[0];
        return {
          type: 'hidden_single',
          row: r,
          col: c,
          suggestedValue: num,
          title: `Key Cell in Box ${boxNumber}`,
          explanation: `Look closely at 3×3 Box ${boxNumber}. There is a missing number that can only legally fit into Row ${r + 1}, Column ${c + 1} because all other empty squares in this box are blocked by row and column peers. Check which missing number fits here!`,
          technique: 'Hidden Single (Box)',
          highlights: [
            { row: r, col: c, type: 'target' },
            ...boxCoords.map(([br, bc]) => ({ row: br, col: bc, type: 'peer' as const })),
          ],
        };
      }
    }
  }

  // 5. Search for Hidden Singles in Rows
  for (let r = 0; r < 9; r++) {
    for (let num = 1; num <= 9; num++) {
      let alreadyInRow = false;
      const validCols: number[] = [];

      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c] === num) {
          alreadyInRow = true;
          break;
        }
        if (currentGrid[r][c] === 0 && isValidPlacement(currentGrid, r, c, num)) {
          validCols.push(c);
        }
      }

      if (!alreadyInRow && validCols.length === 1) {
        const col = validCols[0];
        return {
          type: 'hidden_single',
          row: r,
          col,
          suggestedValue: num,
          title: `Key Cell in Row ${r + 1}`,
          explanation: `Scan Row ${r + 1}. One of the missing numbers for this row can only be placed in Column ${col + 1} because other empty squares in this row are ruled out by column or box constraints. Test the row's missing numbers!`,
          technique: 'Hidden Single (Row)',
          highlights: [
            { row: r, col, type: 'target' },
            ...Array.from({ length: 9 }, (_, i) => ({ row: r, col: i, type: 'peer' as const })),
          ],
        };
      }
    }
  }

  // 6. Search for Hidden Singles in Columns
  for (let c = 0; c < 9; c++) {
    for (let num = 1; num <= 9; num++) {
      let alreadyInCol = false;
      const validRows: number[] = [];

      for (let r = 0; r < 9; r++) {
        if (currentGrid[r][c] === num) {
          alreadyInCol = true;
          break;
        }
        if (currentGrid[r][c] === 0 && isValidPlacement(currentGrid, r, c, num)) {
          validRows.push(r);
        }
      }

      if (!alreadyInCol && validRows.length === 1) {
        const row = validRows[0];
        return {
          type: 'hidden_single',
          row,
          col: c,
          suggestedValue: num,
          title: `Key Cell in Column ${c + 1}`,
          explanation: `Scan Column ${c + 1}. One of the missing column digits has only a single valid spot at Row ${row + 1}. Check the column's remaining digits to identify it.`,
          technique: 'Hidden Single (Column)',
          highlights: [
            { row, col: c, type: 'target' },
            ...Array.from({ length: 9 }, (_, i) => ({ row: i, col: c, type: 'peer' as const })),
          ],
        };
      }
    }
  }

  // 7. Search for Locked Candidates (Pointing Pairs/Triples)
  for (let b = 0; b < 9; b++) {
    const boxCoords = getBoxCoordinates(b);
    for (let num = 1; num <= 9; num++) {
      const numSpots = boxCoords.filter(([r, c]) => currentGrid[r][c] === 0 && isValidPlacement(currentGrid, r, c, num));
      if (numSpots.length === 2 || numSpots.length === 3) {
        const sameRow = numSpots.every(([r]) => r === numSpots[0][0]);
        const sameCol = numSpots.every(([, c]) => c === numSpots[0][1]);

        if (sameRow) {
          const row = numSpots[0][0];
          const outsideCells = Array.from({ length: 9 }, (_, c) => c)
            .filter((c) => Math.floor(c / 3) !== b % 3 && currentGrid[row][c] === 0 && isValidPlacement(currentGrid, row, c, num));

          if (outsideCells.length > 0) {
            const bestTarget = numSpots[0];
            const targetVal = solutionGrid[bestTarget[0]][bestTarget[1]];
            return {
              type: 'locked_candidates',
              row: bestTarget[0],
              col: bestTarget[1],
              suggestedValue: targetVal,
              title: `Locked Line in Box ${b + 1}`,
              explanation: `Notice how in Box ${b + 1}, a candidate is constrained strictly to Row ${row + 1}. This eliminates that number from the rest of Row ${row + 1} outside this box, narrowing down your pencil marks.`,
              technique: 'Locked Candidates (Pointing)',
              highlights: [
                ...numSpots.map(([r, c]) => ({ row: r, col: c, type: 'target' as const })),
                ...outsideCells.map((c) => ({ row, col: c, type: 'cause' as const })),
              ],
            };
          }
        } else if (sameCol) {
          const col = numSpots[0][1];
          const outsideCells = Array.from({ length: 9 }, (_, r) => r)
            .filter((r) => Math.floor(r / 3) !== Math.floor(b / 3) && currentGrid[r][col] === 0 && isValidPlacement(currentGrid, r, col, num));

          if (outsideCells.length > 0) {
            const bestTarget = numSpots[0];
            const targetVal = solutionGrid[bestTarget[0]][bestTarget[1]];
            return {
              type: 'locked_candidates',
              row: bestTarget[0],
              col: bestTarget[1],
              suggestedValue: targetVal,
              title: `Locked Column in Box ${b + 1}`,
              explanation: `In Box ${b + 1}, a candidate can only appear along Column ${col + 1}. This rules out that number from the rest of Column ${col + 1} outside this box.`,
              technique: 'Locked Candidates (Pointing)',
              highlights: [
                ...numSpots.map(([r, c]) => ({ row: r, col: c, type: 'target' as const })),
                ...outsideCells.map((r) => ({ row: r, col, type: 'cause' as const })),
              ],
            };
          }
        }
      }
    }
  }

  // 8. Key deduction square (Fewest candidates remaining)
  let bestR = -1;
  let bestC = -1;
  let minCandidates = 10;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (currentGrid[r][c] === 0) {
        const cands = getPossibleCandidates(currentGrid, r, c);
        if (cands.length > 0 && cands.length < minCandidates) {
          minCandidates = cands.length;
          bestR = r;
          bestC = c;
        }
      }
    }
  }

  if (bestR !== -1 && bestC !== -1) {
    const val = solutionGrid[bestR][bestC];
    return {
      type: 'only_square',
      row: bestR,
      col: bestC,
      suggestedValue: val,
      title: `Opportunity at Row ${bestR + 1}, Col ${bestC + 1}`,
      explanation: `Check Row ${bestR + 1}, Column ${bestC + 1} and examine its row, column, and box peers. Almost all digits 1–9 are eliminated by neighboring cells, leaving very few possibilities to test.`,
      technique: 'Peer Elimination',
      highlights: [
        { row: bestR, col: bestC, type: 'target' },
        ...getDirectPeers(currentGrid, bestR, bestC),
      ],
    };
  }

  return null;
}

function checkHiddenSingleInRow(grid: number[][], row: number, col: number): HintInfo | null {
  for (let num = 1; num <= 9; num++) {
    if (!isValidPlacement(grid, row, col, num)) continue;
    let otherValid = false;
    for (let c = 0; c < 9; c++) {
      if (c !== col && (grid[row][c] === num || (grid[row][c] === 0 && isValidPlacement(grid, row, c, num)))) {
        otherValid = true;
        break;
      }
    }
    if (!otherValid) {
      return {
        type: 'hidden_single',
        row,
        col,
        suggestedValue: num,
        title: `Single Option in Row ${row + 1}`,
        explanation: `In Row ${row + 1}, Column ${col + 1} is the ONLY square where a certain missing digit can legally go. Cross-reference the columns crossing this row to identify which number it is.`,
        technique: 'Hidden Single (Row)',
        highlights: [
          { row, col, type: 'target' },
          ...Array.from({ length: 9 }, (_, i) => ({ row, col: i, type: 'peer' as const })),
        ],
      };
    }
  }
  return null;
}

function checkHiddenSingleInCol(grid: number[][], row: number, col: number): HintInfo | null {
  for (let num = 1; num <= 9; num++) {
    if (!isValidPlacement(grid, row, col, num)) continue;
    let otherValid = false;
    for (let r = 0; r < 9; r++) {
      if (r !== row && (grid[r][col] === num || (grid[r][col] === 0 && isValidPlacement(grid, r, col, num)))) {
        otherValid = true;
        break;
      }
    }
    if (!otherValid) {
      return {
        type: 'hidden_single',
        row,
        col,
        suggestedValue: num,
        title: `Single Option in Column ${col + 1}`,
        explanation: `In Column ${col + 1}, Row ${row + 1} is the ONLY open cell that can take one of the column's missing digits. Examine the intersecting rows to see which number fits.`,
        technique: 'Hidden Single (Column)',
        highlights: [
          { row, col, type: 'target' },
          ...Array.from({ length: 9 }, (_, i) => ({ row: i, col, type: 'peer' as const })),
        ],
      };
    }
  }
  return null;
}

function checkHiddenSingleInBox(grid: number[][], row: number, col: number): HintInfo | null {
  const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const boxCoords = getBoxCoordinates(boxIndex);

  for (let num = 1; num <= 9; num++) {
    if (!isValidPlacement(grid, row, col, num)) continue;
    let otherValid = false;
    for (const [r, c] of boxCoords) {
      if ((r !== row || c !== col) && (grid[r][c] === num || (grid[r][c] === 0 && isValidPlacement(grid, r, c, num)))) {
        otherValid = true;
        break;
      }
    }
    if (!otherValid) {
      return {
        type: 'hidden_single',
        row,
        col,
        suggestedValue: num,
        title: `Single Option in Box ${boxIndex + 1}`,
        explanation: `Inside 3×3 Box ${boxIndex + 1}, Row ${row + 1}, Column ${col + 1} is the ONLY open cell that can accept one of the box's missing numbers. Check which missing number avoids all row and column conflicts.`,
        technique: 'Hidden Single (Box)',
        highlights: [
          { row, col, type: 'target' },
          ...boxCoords.map(([r, c]) => ({ row: r, col: c, type: 'peer' as const })),
        ],
      };
    }
  }
  return null;
}

function getDirectPeers(grid: number[][], row: number, col: number): HintHighlight[] {
  const highlights: HintHighlight[] = [];
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] !== 0) {
      highlights.push({ row, col: c, type: 'cause' });
    }
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] !== 0) {
      highlights.push({ row: r, col, type: 'cause' });
    }
  }
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currR = startRow + r;
      const currC = startCol + c;
      if ((currR !== row || currC !== col) && grid[currR][currC] !== 0) {
        if (!highlights.some((h) => h.row === currR && h.col === currC)) {
          highlights.push({ row: currR, col: currC, type: 'cause' });
        }
      }
    }
  }
  return highlights;
}

function buildNakedSingleHint(
  currentGrid: number[][],
  row: number,
  col: number,
  val: number
): HintInfo {
  const highlights: HintHighlight[] = [
    { row, col, type: 'target' },
    ...getDirectPeers(currentGrid, row, col),
  ];

  return {
    type: 'naked_single',
    row,
    col,
    suggestedValue: val,
    title: `Naked Single at Row ${row + 1}, Col ${col + 1}`,
    explanation: `This highlighted cell has only ONE legal number remaining after eliminating all numbers present in its row, column, and 3×3 box. Cross-reference the highlighted peers to find which number (1–9) is missing!`,
    technique: 'Naked Single',
    highlights,
  };
}
