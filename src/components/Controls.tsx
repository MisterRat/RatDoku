import React from 'react';
import { Undo2, Eraser, Pencil, Lightbulb, Check } from 'lucide-react';
import { ThemeStyles } from '../utils/theme';
import { useI18n } from '../i18n';

interface ControlsProps {
  onNumberInput: (num: number) => void;
  onErase: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isNoteMode: boolean;
  onToggleNoteMode: () => void;
  onTriggerHint: () => void;
  numberCounts: Record<number, number>; // How many of each number (1-9) are placed
  selectedNumber: number | null;
  theme: ThemeStyles;
}

export const Controls: React.FC<ControlsProps> = ({
  onNumberInput,
  onErase,
  onUndo,
  canUndo,
  isNoteMode,
  onToggleNoteMode,
  onTriggerHint,
  numberCounts,
  selectedNumber,
  theme,
}) => {
  const { t } = useI18n();
  return (
    <div id="sudoku-controls-container" className="w-full max-w-[490px] mx-auto space-y-3 px-1 sm:px-2">
      {/* Top Action Bar (Undo, Erase, Pencil Note, Hint) */}
      <div className="grid grid-cols-4 gap-2">
        {/* Undo */}
        <button
          id="btn-undo"
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
            canUndo
              ? `${theme.controlBtnBg} cursor-pointer active:scale-95 shadow-sm`
              : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 dark:text-neutral-600 border border-transparent cursor-not-allowed opacity-50'
          }`}
          title={t('controls.undoTitle')}
        >
          <Undo2 className="w-5 h-5 mb-1" />
          <span>{t('controls.undo')}</span>
        </button>

        {/* Erase */}
        <button
          id="btn-erase"
          type="button"
          onClick={onErase}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 shadow-sm ${theme.controlBtnBg}`}
          title={t('controls.eraseTitle')}
        >
          <Eraser className="w-5 h-5 mb-1" />
          <span>{t('controls.erase')}</span>
        </button>

        {/* Pencil/Notes Mode */}
        <button
          id="btn-notes"
          type="button"
          onClick={onToggleNoteMode}
          className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 shadow-sm ${
            isNoteMode ? theme.controlBtnActiveBg : theme.controlBtnBg
          }`}
          title={t('controls.notesTitle')}
        >
          <Pencil className="w-5 h-5 mb-1" />
          <div className="flex items-center gap-1">
            <span>{t('controls.notes')}</span>
            <span
              className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                isNoteMode
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {isNoteMode ? t('controls.on') : t('controls.off')}
            </span>
          </div>
        </button>

        {/* Hint */}
        <button
          id="btn-hint"
          type="button"
          onClick={onTriggerHint}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 shadow-sm ${theme.controlBtnBg} hover:border-amber-400 group`}
          title={t('controls.hintTitle')}
        >
          <Lightbulb className="w-5 h-5 mb-1 text-amber-500 group-hover:scale-110 transition-transform" />
          <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400">{t('controls.hint')}</span>
        </button>
      </div>

      {/* Number Pad (1-9) */}
      <div id="number-pad" className="grid grid-cols-9 gap-1 sm:gap-1.5 pt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const count = numberCounts[num] || 0;
          const isComplete = count >= 9;
          const isSelected = selectedNumber === num;

          return (
            <button
              key={num}
              id={`num-key-${num}`}
              type="button"
              onClick={() => onNumberInput(num)}
              className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3 rounded-xl font-mono-num font-semibold text-lg sm:text-xl transition-all cursor-pointer select-none active:scale-90 shadow-sm ${
                isComplete
                  ? 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-400 dark:text-neutral-600 border border-transparent'
                  : isSelected
                  ? 'bg-blue-600 text-white dark:bg-sky-500 shadow-md ring-2 ring-blue-400'
                  : `${theme.controlBtnBg}`
              }`}
              aria-label={t('controls.numberLabel', { num, left: 9 - count })}
            >
              <span>{num}</span>
              <span className="text-[10px] font-sans font-normal leading-none mt-0.5 opacity-70">
                {isComplete ? (
                  <Check className="w-2.5 h-2.5 inline text-emerald-500 dark:text-emerald-400" />
                ) : (
                  9 - count
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
