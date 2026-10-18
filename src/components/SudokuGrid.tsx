import React from 'react';
import { CellData, HintInfo } from '../types';
import { ThemeStyles } from '../utils/theme';

interface SudokuGridProps {
  board: CellData[][];
  selectedCell: { row: number; col: number } | null;
  onSelectCell: (row: number, col: number) => void;
  highlightedNumber: number | null;
  activeHint: HintInfo | null;
  theme: ThemeStyles;
  isPaused: boolean;
  isGenerating?: boolean;
  onResume: () => void;
  highlightPeers: boolean;
  highlightMatchingNumbers: boolean;
  highlightDuplicates: boolean;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  selectedCell,
  onSelectCell,
  highlightedNumber,
  activeHint,
  theme,
  isPaused,
  isGenerating = false,
  onResume,
  highlightPeers,
  highlightMatchingNumbers,
  highlightDuplicates,
}) => {
  // Check if a cell is a peer of the selected cell (same row, col, or 3x3 box)
  const isPeerOfSelected = (r: number, c: number) => {
    if (!selectedCell || !highlightPeers) return false;
    if (r === selectedCell.row && c === selectedCell.col) return false;
    if (r === selectedCell.row || c === selectedCell.col) return true;
    const boxR = Math.floor(selectedCell.row / 3);
    const boxC = Math.floor(selectedCell.col / 3);
    return Math.floor(r / 3) === boxR && Math.floor(c / 3) === boxC;
  };

  // Determine hint status of a cell
  const getHintHighlight = (r: number, c: number) => {
    if (!activeHint) return null;
    return activeHint.highlights.find((h) => h.row === r && h.col === c) || null;
  };

  return (
    <div
      id="sudoku-board-container"
      className="relative w-full max-w-[490px] mx-auto aspect-square select-none p-1 sm:p-2"
    >
      {/* 9x9 Grid */}
      <div
        id="sudoku-grid"
        className={`w-full h-full grid grid-cols-9 grid-rows-9 border-2 md:border-[3px] ${theme.thickBorderColor} rounded-xl overflow-hidden shadow-2xl ${theme.gridBg} transition-colors duration-200`}
      >
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
            const isPeer = isPeerOfSelected(rIdx, cIdx);
            const isMatchingNum =
              highlightMatchingNumbers &&
              highlightedNumber !== null &&
              highlightedNumber > 0 &&
              cell.value === highlightedNumber;
            const hintHighlight = getHintHighlight(rIdx, cIdx);
            const hasError = highlightDuplicates && cell.isError;

            // Border styling for 3x3 subgrids
            const isRightBoxBorder = cIdx % 3 === 2 && cIdx !== 8;
            const isBottomBoxBorder = rIdx % 3 === 2 && rIdx !== 8;
            const isRegularRightBorder = !isRightBoxBorder && cIdx !== 8;
            const isRegularBottomBorder = !isBottomBoxBorder && rIdx !== 8;

            // Dynamic cell background color
            let cellBgClass = theme.cellBg;
            if (isSelected) {
              cellBgClass = theme.selectedCellBg;
            } else if (hintHighlight) {
              if (hintHighlight.type === 'target') {
                cellBgClass = theme.hintTargetBg;
              } else if (hintHighlight.type === 'cause') {
                cellBgClass = 'bg-amber-100 dark:bg-amber-900/50 ring-1 ring-amber-400';
              } else {
                cellBgClass = theme.hintPeerBg;
              }
            } else if (hasError) {
              cellBgClass = theme.errorCellBg;
            } else if (isMatchingNum) {
              cellBgClass = theme.sameNumberBg;
            } else if (isPeer) {
              cellBgClass = theme.peerCellBg;
            }

            // Cell text color
            let cellTextClass = cell.isInitial ? theme.initialCellText : theme.userCellText;
            if (hasError) {
              cellTextClass = theme.errorCellText;
            }

            return (
              <button
                key={`${rIdx}-${cIdx}`}
                id={`sudoku-cell-${rIdx}-${cIdx}`}
                type="button"
                onClick={() => onSelectCell(rIdx, cIdx)}
                className={`relative flex items-center justify-center p-0 cursor-pointer focus:outline-none transition-all duration-100 ${cellBgClass} ${
                  isRightBoxBorder ? `border-r-2 md:border-r-[2.5px] ${theme.thickBorderColor}` : ''
                } ${
                  isBottomBoxBorder ? `border-b-2 md:border-b-[2.5px] ${theme.thickBorderColor}` : ''
                } ${
                  isRegularRightBorder ? `border-r ${theme.borderColor}` : ''
                } ${
                  isRegularBottomBorder ? `border-b ${theme.borderColor}` : ''
                } ${
                  isSelected ? 'z-10 ring-2 ring-blue-500/80 dark:ring-sky-400' : ''
                }`}
                aria-label={`Row ${rIdx + 1}, Column ${cIdx + 1}, Value ${cell.value || 'Empty'}`}
              >
                {cell.value !== 0 ? (
                  // Main filled number
                  <span
                    className={`font-mono-num text-xl sm:text-2xl md:text-3xl transition-transform duration-100 ${cellTextClass} ${
                      isSelected ? 'scale-110' : ''
                    }`}
                  >
                    {cell.value}
                  </span>
                ) : (
                  // 3x3 mini-grid for pencil notes
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-0.5 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <div
                        key={n}
                        className={`flex items-center justify-center font-mono-num text-[9px] sm:text-[10px] md:text-[11px] leading-none ${
                          cell.notes.includes(n) ? `${theme.noteText} font-semibold` : 'opacity-0'
                        } ${
                          highlightMatchingNumbers && highlightedNumber === n && cell.notes.includes(n)
                            ? 'text-blue-600 dark:text-sky-400 font-bold scale-125'
                            : ''
                        }`}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                )}

                {/* Hint target pulsing dot */}
                {hintHighlight?.type === 'target' && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* New-puzzle Overlay */}
      {isGenerating && (
        <div
          id="sudoku-generating-overlay"
          role="status"
          aria-live="polite"
          className="absolute inset-0 m-1 sm:m-2 bg-neutral-900/70 backdrop-blur-md rounded-xl flex flex-col items-center justify-center text-white z-40"
        >
          <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          <p className="text-sm text-neutral-200 mt-3">Building your puzzle…</p>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && !isGenerating && (
        <div
          id="sudoku-pause-overlay"
          className="absolute inset-0 m-1 sm:m-2 bg-neutral-900/70 backdrop-blur-md rounded-xl flex flex-col items-center justify-center text-white z-30 transition-all duration-200"
        >
          <div className="text-center p-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center text-2xl">
              ⏸
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Game Paused</h3>
              <p className="text-sm text-neutral-300 mt-1">Timer is paused. Tap resume when ready.</p>
            </div>
            <button
              id="resume-game-button"
              type="button"
              onClick={onResume}
              className="px-6 py-2.5 rounded-lg bg-white text-neutral-950 font-medium text-sm hover:bg-neutral-100 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
