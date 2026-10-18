import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Difficulty,
  GameMode,
  CellData,
  SudokuPuzzle,
  MoveStep,
  HintInfo,
  GameSettings,
  OverallStats,
  SavedGameState,
} from './types';
import {
  findSmartHint,
  isValidPlacement,
} from './utils/sudokuGenerator';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  recordGameWin,
  loadSavedGame,
  saveActiveGame,
  getTodayDateKey,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { THEMES } from './utils/theme';
import { generatePuzzleAsync, warmUpPuzzleWorker } from './utils/puzzleWorkerClient';
import { soundManager } from './utils/sound';
import { Header } from './components/Header';
import { SudokuGrid } from './components/SudokuGrid';
import { Controls } from './components/Controls';
import { HintBar } from './components/HintBar';
import { VictoryModal } from './components/VictoryModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  // Settings & Theme
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [stats, setStats] = useState<OverallStats>(() => loadStats());
  const theme = THEMES[settings.theme] || THEMES['minimal-light'];

  // Game configuration
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [mode, setMode] = useState<GameMode>('daily');
  const [dateKey, setDateKey] = useState<string>(getTodayDateKey());

  // Active puzzle & board state
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null);
  const [board, setBoard] = useState<CellData[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);

  // History for Undo
  const [history, setHistory] = useState<MoveStep[]>([]);

  // Performance tracking & timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [hintsCount, setHintsCount] = useState<number>(0);
  const [activeHint, setActiveHint] = useState<HintInfo | null>(null);

  // Modals state
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showDailyModal, setShowDailyModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [isNewBestTime, setIsNewBestTime] = useState<boolean>(false);

  // Puzzle generation runs in a Web Worker; only the newest request is applied.
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const generationRequestRef = useRef(0);

  // Sync sound manager with settings
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Convert raw 9x9 matrix to CellData board
  const createBoardFromPuzzle = useCallback((newPuzzle: SudokuPuzzle): CellData[][] => {
    return newPuzzle.initialGrid.map((row, rIdx) =>
      row.map((val, cIdx) => ({
        row: rIdx,
        col: cIdx,
        value: val,
        solutionValue: newPuzzle.solutionGrid[rIdx][cIdx],
        isInitial: val !== 0,
        notes: [],
        isError: false,
      }))
    );
  }, []);

  // Start a fresh new game (puzzle is generated off the main thread)
  const startNewGame = useCallback(
    (
      targetDifficulty: Difficulty = difficulty,
      targetMode: GameMode = mode,
      targetDateKey?: string,
      startPaused: boolean = false
    ) => {
      const dKey = targetDateKey || (targetMode === 'daily' ? getTodayDateKey() : undefined);
      const requestId = ++generationRequestRef.current;

      setDifficulty(targetDifficulty);
      setMode(targetMode);
      if (dKey) setDateKey(dKey);
      setIsGenerating(true);
      setIsPaused(true); // stop the old timer and block input until the new board arrives
      setActiveHint(null);
      setShowVictoryModal(false);
      setShowGameOverModal(false);

      generatePuzzleAsync(targetDifficulty, targetMode, dKey).then((newPuzzle) => {
        // A newer request superseded this one (e.g. the player tapped another difficulty).
        if (requestId !== generationRequestRef.current) return;

        const newBoard = createBoardFromPuzzle(newPuzzle);
        setPuzzle(newPuzzle);
        setBoard(newBoard);
        setSelectedCell(null);
        setHighlightedNumber(null);
        setHistory([]);
        setTimerSeconds(0);
        setIsPaused(startPaused);
        setIsCompleted(false);
        setMistakesCount(0);
        setHintsCount(0);
        setActiveHint(null);
        setIsNewBestTime(false);
        setIsGenerating(false);

        // Save new active state
        saveActiveGame({
          puzzle: newPuzzle,
          board: newBoard,
          timerSeconds: 0,
          isPaused: startPaused,
          isComplete: false,
          mistakesCount: 0,
          hintsCount: 0,
          difficulty: targetDifficulty,
          mode: targetMode,
          dateKey: dKey,
        });
      });
    },
    [createBoardFromPuzzle, difficulty, mode]
  );

  // Restart current board
  const restartCurrentBoard = useCallback(() => {
    if (!puzzle || isGenerating) return;
    const resetBoard = createBoardFromPuzzle(puzzle);
    setBoard(resetBoard);
    setSelectedCell(null);
    setHighlightedNumber(null);
    setHistory([]);
    setTimerSeconds(0);
    setIsPaused(false);
    setIsCompleted(false);
    setMistakesCount(0);
    setHintsCount(0);
    setActiveHint(null);
    setShowVictoryModal(false);
    setShowGameOverModal(false);
  }, [createBoardFromPuzzle, puzzle, isGenerating]);

  // Initial load: restore saved active game or generate fresh game (always loads paused in daily mode)
  useEffect(() => {
    warmUpPuzzleWorker();
    const saved = loadSavedGame();
    if (saved && saved.puzzle && saved.board && !saved.isComplete) {
      setPuzzle(saved.puzzle);
      setBoard(saved.board);
      setTimerSeconds(saved.timerSeconds || 0);
      setDifficulty(saved.difficulty || 'medium');
      setMode(saved.mode || 'daily');
      const targetDate = saved.dateKey || getTodayDateKey();
      setDateKey(targetDate);
      setMistakesCount(saved.mistakesCount || 0);
      setHintsCount(saved.hintsCount || 0);
      setIsPaused(true);
      setIsCompleted(false);
    } else {
      const today = getTodayDateKey();
      setDateKey(today);
      setMode('daily');
      startNewGame('medium', 'daily', today, true);
    }
  }, []);

  // Timer Tick
  useEffect(() => {
    if (isPaused || isCompleted || !puzzle) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev + 1;
        // Autosave timer periodically
        if (next % 5 === 0 && board.length > 0 && puzzle) {
          saveActiveGame({
            puzzle,
            board,
            timerSeconds: next,
            isPaused: false,
            isComplete: false,
            mistakesCount,
            hintsCount,
            difficulty,
            mode,
            dateKey,
          });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isCompleted, puzzle, board, mistakesCount, hintsCount, difficulty, mode, dateKey]);

  // Cell selection handler
  const handleSelectCell = (r: number, c: number) => {
    if (isGenerating) return;
    if (isPaused) {
      setIsPaused(false);
    }
    soundManager.playSelect();
    setSelectedCell({ row: r, col: c });

    const cellVal = board[r][c].value;
    if (cellVal > 0) {
      setHighlightedNumber(cellVal);
    }
    // Clear active hint on new manual cell selection
    if (activeHint && (activeHint.row !== r || activeHint.col !== c)) {
      setActiveHint(null);
    }
  };

  // Calculate current numbers placed on the board for 1-9 count badges
  const numberCounts = React.useMemo(() => {
    const counts: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.value >= 1 && cell.value <= 9 && !cell.isError) {
          counts[cell.value] = (counts[cell.value] || 0) + 1;
        }
      });
    });
    return counts;
  }, [board]);

  // Check victory status
  const checkVictory = useCallback(
    (currentBoard: CellData[][]) => {
      if (!puzzle) return false;

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const val = currentBoard[r][c].value;
          if (val === 0 || val !== puzzle.solutionGrid[r][c]) {
            return false;
          }
        }
      }
      return true;
    },
    [puzzle]
  );

  // Entering a number (via number pad or keyboard)
  const handleNumberInput = useCallback(
    (num: number) => {
      if (!selectedCell || !puzzle || isCompleted || isPaused) return;
      const { row, col } = selectedCell;
      const targetCell = board[row][col];

      if (targetCell.isInitial) {
        setHighlightedNumber(num);
        return;
      }

      setHighlightedNumber(num);

      if (isNoteMode) {
        // Toggle note candidate
        soundManager.playNote();
        const prevNotes = [...targetCell.notes];
        const newNotes = prevNotes.includes(num)
          ? prevNotes.filter((n) => n !== num)
          : [...prevNotes, num].sort((a, b) => a - b);

        const newBoard = board.map((r, rIdx) =>
          r.map((c, cIdx) => (rIdx === row && cIdx === col ? { ...c, notes: newNotes } : c))
        );

        setBoard(newBoard);
        setHistory((prev) => [
          ...prev,
          {
            row,
            col,
            prevValue: targetCell.value,
            newValue: targetCell.value,
            prevNotes,
            newNotes,
          },
        ]);
        return;
      }

      // Regular Number Placement
      const prevValue = targetCell.value;
      const prevNotes = [...targetCell.notes];

      // If clicking same number that is already there, toggle it to 0
      if (prevValue === num) {
        soundManager.playErase();
        const newBoard = board.map((r, rIdx) =>
          r.map((c, cIdx) => (rIdx === row && cIdx === col ? { ...c, value: 0, isError: false } : c))
        );
        setBoard(newBoard);
        setHistory((prev) => [
          ...prev,
          {
            row,
            col,
            prevValue,
            newValue: 0,
            prevNotes,
            newNotes: prevNotes,
          },
        ]);
        return;
      }

      const isCorrect = num === puzzle.solutionGrid[row][col];
      const isConflicted = !isValidPlacement(
        board.map((r) => r.map((c) => (c.row === row && c.col === col ? 0 : c.value))),
        row,
        col,
        num
      );

      let newMistakes = mistakesCount;
      if (!isCorrect || isConflicted) {
        soundManager.playError();
        newMistakes = mistakesCount + 1;
        setMistakesCount(newMistakes);

        if (settings.errorLimit && newMistakes >= settings.errorLimit) {
          setShowGameOverModal(true);
          setIsPaused(true);
        }
      } else {
        soundManager.playNumber(num);
      }

      // Auto-remove notes in row, column, and box if enabled
      const affectedNotes: MoveStep['affectedNotes'] = [];
      const newBoard = board.map((r, rIdx) =>
        r.map((c, cIdx) => {
          if (rIdx === row && cIdx === col) {
            return {
              ...c,
              value: num,
              notes: [],
              isError: !isCorrect || isConflicted,
            };
          }

          if (settings.autoRemoveNotes && isCorrect && c.notes.includes(num)) {
            const isSameRow = rIdx === row;
            const isSameCol = cIdx === col;
            const isSameBox =
              Math.floor(rIdx / 3) === Math.floor(row / 3) && Math.floor(cIdx / 3) === Math.floor(col / 3);

            if (isSameRow || isSameCol || isSameBox) {
              affectedNotes.push({
                row: rIdx,
                col: cIdx,
                prevNotes: [...c.notes],
                newNotes: c.notes.filter((n) => n !== num),
              });
              return {
                ...c,
                notes: c.notes.filter((n) => n !== num),
              };
            }
          }

          return c;
        })
      );

      setBoard(newBoard);
      setHistory((prev) => [
        ...prev,
        {
          row,
          col,
          prevValue,
          newValue: num,
          prevNotes,
          newNotes: [],
          affectedNotes,
        },
      ]);

      // Check for puzzle completion
      if (isCorrect && checkVictory(newBoard)) {
        setIsCompleted(true);
        soundManager.playVictory();

        // Calculate and update win records
        const currentBest = stats[difficulty].bestTime;
        const isBest = currentBest === null || timerSeconds < currentBest;
        setIsNewBestTime(isBest);

        const isDailyGame = puzzle.mode === 'daily' || mode === 'daily' || puzzle.id.startsWith('daily-');
        const targetDate = puzzle.dateKey || dateKey || (isDailyGame ? getTodayDateKey() : undefined);

        const updatedStats = recordGameWin(
          difficulty,
          timerSeconds,
          isDailyGame,
          targetDate,
          hintsCount
        );
        setStats(updatedStats);
        setShowVictoryModal(true);
        saveActiveGame(null); // Clear active in-progress game
      }
    },
    [
      selectedCell,
      puzzle,
      isCompleted,
      isPaused,
      board,
      isNoteMode,
      mistakesCount,
      settings.errorLimit,
      settings.autoRemoveNotes,
      checkVictory,
      stats,
      difficulty,
      timerSeconds,
      mode,
      dateKey,
      hintsCount,
    ]
  );

  // Erase action
  const handleErase = useCallback(() => {
    if (!selectedCell || !puzzle || isCompleted || isPaused) return;
    const { row, col } = selectedCell;
    const targetCell = board[row][col];

    if (targetCell.isInitial) return;
    if (targetCell.value === 0 && targetCell.notes.length === 0) return;

    soundManager.playErase();
    const prevValue = targetCell.value;
    const prevNotes = [...targetCell.notes];

    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) =>
        rIdx === row && cIdx === col ? { ...c, value: 0, notes: [], isError: false } : c
      )
    );

    setBoard(newBoard);
    setHistory((prev) => [
      ...prev,
      {
        row,
        col,
        prevValue,
        newValue: 0,
        prevNotes,
        newNotes: [],
      },
    ]);
  }, [selectedCell, puzzle, isCompleted, isPaused, board]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isCompleted || isPaused) return;
    const lastMove = history[history.length - 1];
    soundManager.playSelect();

    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) => {
        if (rIdx === lastMove.row && cIdx === lastMove.col) {
          return {
            ...c,
            value: lastMove.prevValue,
            notes: lastMove.prevNotes,
            isError: false,
          };
        }

        // Restore any affected notes in peers
        if (lastMove.affectedNotes) {
          const aff = lastMove.affectedNotes.find((a) => a.row === rIdx && a.col === cIdx);
          if (aff) {
            return {
              ...c,
              notes: aff.prevNotes,
            };
          }
        }

        return c;
      })
    );

    setBoard(newBoard);
    setHistory((prev) => prev.slice(0, -1));
    setSelectedCell({ row: lastMove.row, col: lastMove.col });
  }, [history, isCompleted, isPaused, board]);

  // Smart Hint action
  const handleTriggerHint = useCallback(() => {
    if (!puzzle || isCompleted || isPaused) return;

    const currentGrid = board.map((r) => r.map((c) => c.value));
    const hint = findSmartHint(
      currentGrid,
      puzzle.solutionGrid,
      selectedCell?.row,
      selectedCell?.col
    );

    if (hint) {
      soundManager.playHint();
      setActiveHint(hint);
      setSelectedCell({ row: hint.row, col: hint.col });
      setHintsCount((prev) => prev + 1);
    }
  }, [puzzle, isCompleted, isPaused, board, selectedCell]);

  // Apply hint suggestion
  const handleApplyHint = useCallback(() => {
    if (!activeHint || !puzzle) return;
    const { row, col, suggestedValue } = activeHint;

    soundManager.playNumber(suggestedValue);
    setSelectedCell({ row, col });
    setHighlightedNumber(suggestedValue);

    const prevValue = board[row][col].value;
    const prevNotes = [...board[row][col].notes];

    const affectedNotes: MoveStep['affectedNotes'] = [];
    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) => {
        if (rIdx === row && cIdx === col) {
          return {
            ...c,
            value: suggestedValue,
            notes: [],
            isError: false,
          };
        }
        if (settings.autoRemoveNotes && c.notes.includes(suggestedValue)) {
          const isSameRow = rIdx === row;
          const isSameCol = cIdx === col;
          const isSameBox =
            Math.floor(rIdx / 3) === Math.floor(row / 3) && Math.floor(cIdx / 3) === Math.floor(col / 3);

          if (isSameRow || isSameCol || isSameBox) {
            affectedNotes.push({
              row: rIdx,
              col: cIdx,
              prevNotes: [...c.notes],
              newNotes: c.notes.filter((n) => n !== suggestedValue),
            });
            return {
              ...c,
              notes: c.notes.filter((n) => n !== suggestedValue),
            };
          }
        }
        return c;
      })
    );

    setBoard(newBoard);
    setActiveHint(null);
    setHistory((prev) => [
      ...prev,
      {
        row,
        col,
        prevValue,
        newValue: suggestedValue,
        prevNotes,
        newNotes: [],
        affectedNotes,
      },
    ]);

    if (checkVictory(newBoard)) {
      setIsCompleted(true);
      soundManager.playVictory();

      const isDailyGame = puzzle.mode === 'daily' || mode === 'daily' || puzzle.id.startsWith('daily-');
      const targetDate = puzzle.dateKey || dateKey || (isDailyGame ? getTodayDateKey() : undefined);

      const updatedStats = recordGameWin(
        difficulty,
        timerSeconds,
        isDailyGame,
        targetDate,
        hintsCount + 1
      );
      setStats(updatedStats);
      setShowVictoryModal(true);
      saveActiveGame(null);
    }
  }, [
    activeHint,
    puzzle,
    board,
    settings.autoRemoveNotes,
    checkVictory,
    difficulty,
    timerSeconds,
    mode,
    dateKey,
    hintsCount,
  ]);

  // Keyboard navigation & controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Ignore game keys while a new puzzle is being built
      if (isGenerating) return;

      // Close modal on Escape
      if (e.key === 'Escape') {
        if (activeHint) setActiveHint(null);
        if (showDailyModal) setShowDailyModal(false);
        if (showStatsModal) setShowStatsModal(false);
        if (showSettingsModal) setShowSettingsModal(false);
        return;
      }

      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleNumberInput(parseInt(e.key, 10));
        return;
      }

      // Erase (Backspace or Delete)
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleErase();
        return;
      }

      // Notes toggle (N or n)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsNoteMode((prev) => !prev);
        soundManager.playSelect();
        return;
      }

      // Undo (U or Ctrl+Z / Cmd+Z)
      if (e.key === 'u' || e.key === 'U' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Hint (H or h)
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleTriggerHint();
        return;
      }

      // Pause / Play (Space or P)
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
        return;
      }

      // Arrow keys navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (!prev) return { row: 4, col: 4 };
          let r = prev.row;
          let c = prev.col;
          if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
          if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
          if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
          if (e.key === 'ArrowRight') c = Math.min(8, c + 1);

          soundManager.playSelect();
          const targetVal = board[r]?.[c]?.value;
          if (targetVal && targetVal > 0) {
            setHighlightedNumber(targetVal);
          }
          return { row: r, col: c };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberInput, handleErase, handleUndo, handleTriggerHint, activeHint, showDailyModal, showStatsModal, showSettingsModal, board, isGenerating]);

  return (
    <div
      id="sudoku-app-root"
      className={`min-h-screen ${theme.bodyBg} ${theme.textColor} transition-colors duration-200 flex flex-col justify-between pb-6`}
    >
      {/* Header */}
      <Header
        difficulty={difficulty}
        onChangeDifficulty={(newDiff) => {
          setDifficulty(newDiff);
          startNewGame(newDiff, mode, dateKey);
        }}
        mode={mode}
        dateKey={dateKey}
        onSelectDaily={() => {
          const today = getTodayDateKey();
          setMode('daily');
          setDateKey(today);
          startNewGame(difficulty, 'daily', today);
        }}
        onSelectClassic={() => {
          setMode('classic');
          startNewGame(difficulty, 'classic');
        }}
        onNewGame={() => startNewGame(difficulty, mode, dateKey)}
        onRestartCurrentGame={restartCurrentBoard}
        timerSeconds={timerSeconds}
        isPaused={isPaused}
        onTogglePause={() => {
          if (!isGenerating) setIsPaused((prev) => !prev);
        }}
        mistakesCount={mistakesCount}
        errorLimit={settings.errorLimit}
        dailyStreak={stats.dailyStreak}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => {
          const nextVal = !settings.soundEnabled;
          const updated = { ...settings, soundEnabled: nextVal };
          setSettings(updated);
          saveSettings(updated);
        }}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenDailyModal={() => setShowDailyModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        theme={theme}
      />

      {/* Main Play Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center py-2 sm:py-3 space-y-3">
        {/* Active Smart Hint Card */}
        {activeHint && (
          <div className="w-full px-2 sm:px-4">
            <HintBar
              hint={activeHint}
              onApplyHint={handleApplyHint}
              onDismiss={() => setActiveHint(null)}
              theme={theme}
            />
          </div>
        )}

        {/* 9x9 Sudoku Grid */}
        <SudokuGrid
          board={board}
          selectedCell={selectedCell}
          onSelectCell={handleSelectCell}
          highlightedNumber={highlightedNumber}
          activeHint={activeHint}
          theme={theme}
          isPaused={isPaused}
          isGenerating={isGenerating}
          onResume={() => {
            if (!isGenerating) setIsPaused(false);
          }}
          highlightPeers={settings.highlightPeers}
          highlightMatchingNumbers={settings.highlightMatchingNumbers}
          highlightDuplicates={settings.highlightDuplicates}
        />

        {/* Actions & Number Pad */}
        <Controls
          onNumberInput={handleNumberInput}
          onErase={handleErase}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          isNoteMode={isNoteMode}
          onToggleNoteMode={() => {
            setIsNoteMode((prev) => !prev);
            soundManager.playSelect();
          }}
          onTriggerHint={handleTriggerHint}
          numberCounts={numberCounts}
          selectedNumber={highlightedNumber}
          theme={theme}
        />
      </main>

      {/* Victory Celebration Modal */}
      {showVictoryModal && (
        <VictoryModal
          difficulty={difficulty}
          mode={mode}
          dateKey={dateKey}
          timeSeconds={timerSeconds}
          bestTime={stats[difficulty].bestTime}
          isNewBest={isNewBestTime}
          mistakesCount={mistakesCount}
          hintsUsed={hintsCount}
          dailyStreak={stats.dailyStreak}
          onPlayAnotherSameLevel={() => {
            setShowVictoryModal(false);
            startNewGame(difficulty, mode, dateKey);
          }}
          onPlayNextDifficulty={
            difficulty === 'easy'
              ? () => {
                  setShowVictoryModal(false);
                  startNewGame('medium', mode, dateKey);
                }
              : difficulty === 'medium'
              ? () => {
                  setShowVictoryModal(false);
                  startNewGame('hard', mode, dateKey);
                }
              : undefined
          }
          onOpenDailyModal={() => {
            setShowVictoryModal(false);
            setShowDailyModal(true);
          }}
          onClose={() => setShowVictoryModal(false)}
          theme={theme}
        />
      )}

      {/* Daily Challenge Calendar Modal */}
      {showDailyModal && (
        <DailyChallengeModal
          onSelectDailyGame={(selectedDate, selectedDiff) => {
            setMode('daily');
            setDateKey(selectedDate);
            setDifficulty(selectedDiff);
            startNewGame(selectedDiff, 'daily', selectedDate);
          }}
          onClose={() => setShowDailyModal(false)}
          currentDateKey={dateKey}
          dailyStreak={stats.dailyStreak}
          theme={theme}
        />
      )}

      {/* Statistics Modal */}
      {showStatsModal && (
        <StatsModal
          stats={stats}
          onClose={() => setShowStatsModal(false)}
          theme={theme}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            saveSettings(newSettings);
          }}
          onClose={() => setShowSettingsModal(false)}
          theme={theme}
        />
      )}

      {/* Game Over Modal (3-strikes limit) */}
      {showGameOverModal && (
        <GameOverModal
          difficulty={difficulty}
          onRestart={restartCurrentBoard}
          onNewGame={() => startNewGame(difficulty, mode, dateKey)}
          theme={theme}
        />
      )}
    </div>
  );
}
