import React from 'react';
import { AlertCircle, RotateCcw, Plus } from 'lucide-react';
import { Difficulty } from '../types';
import { ThemeStyles } from '../utils/theme';
import { useI18n } from '../i18n';

interface GameOverModalProps {
  difficulty: Difficulty;
  onRestart: () => void;
  onNewGame: () => void;
  theme: ThemeStyles;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  difficulty,
  onRestart,
  onNewGame,
  theme,
}) => {
  const { t, difficulty: diffName } = useI18n();
  return (
    <div
      id="game-over-modal-backdrop"
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="game-over-modal-content"
        className={`w-full max-w-md p-6 rounded-2xl ${theme.cardBg} border ${theme.borderColor} shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200`}
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-bold tracking-tight">{t('gameOver.title')}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {t('gameOver.text', { difficulty: diffName(difficulty) })}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            id="btn-gameover-restart"
            type="button"
            onClick={onRestart}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 ${theme.accentBtn} cursor-pointer active:scale-95 transition-all`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('gameOver.tryAgain')}</span>
          </button>

          <button
            id="btn-gameover-new"
            type="button"
            onClick={onNewGame}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 ${theme.controlBtnBg} cursor-pointer active:scale-95 transition-all`}
          >
            <Plus className="w-4 h-4" />
            <span>{t('gameOver.newGame')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
