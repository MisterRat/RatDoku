import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Zap, Lightbulb, AlertTriangle, ArrowRight, RotateCw, Calendar, Flame } from 'lucide-react';
import { Difficulty, GameMode } from '../types';
import { formatTime } from '../utils/storage';
import { ThemeStyles } from '../utils/theme';
import { useI18n } from '../i18n';

interface VictoryModalProps {
  difficulty: Difficulty;
  mode: GameMode;
  dateKey?: string;
  timeSeconds: number;
  bestTime: number | null;
  isNewBest: boolean;
  mistakesCount: number;
  hintsUsed: number;
  dailyStreak: number;
  onPlayAnotherSameLevel: () => void;
  onPlayNextDifficulty?: () => void;
  onOpenDailyModal: () => void;
  onClose: () => void;
  theme: ThemeStyles;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  difficulty,
  mode,
  dateKey,
  timeSeconds,
  bestTime,
  isNewBest,
  mistakesCount,
  hintsUsed,
  dailyStreak,
  onPlayAnotherSameLevel,
  onPlayNextDifficulty,
  onOpenDailyModal,
  onClose,
  theme,
}) => {
  const { t, difficulty: diffName, formatDate } = useI18n();
  useEffect(() => {
    // Launch celebratory confetti bursts
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch {
      // Ignore if canvas is unavailable
    }
  }, []);

  const getNextDifficulty = (current: Difficulty): Difficulty | null => {
    if (current === 'easy') return 'medium';
    if (current === 'medium') return 'hard';
    return null;
  };

  const nextDiff = getNextDifficulty(difficulty);

  return (
    <div
      id="victory-modal-backdrop"
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="victory-modal-content"
        className={`w-full max-w-md p-6 sm:p-7 rounded-2xl ${theme.cardBg} border ${theme.borderColor} shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200`}
      >
        {/* Header Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
          <Trophy className="w-9 h-9" />
          {isNewBest && (
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow">
              {t('victory.newBest')}
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('victory.solved')}</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 capitalize">
            {mode === 'daily'
              ? t('victory.dailySubtitle', {
                  difficulty: diffName(difficulty),
                  date: dateKey ? formatDate(dateKey) : t('victory.today'),
                })
              : t('victory.classicSubtitle', { difficulty: diffName(difficulty) })}
          </p>
        </div>

        {/* Performance Metrics Grid */}
        <div className={`grid grid-cols-3 gap-2 p-3.5 rounded-xl ${theme.subtleBg} border ${theme.borderColor}`}>
          {/* Time */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('victory.time')}</span>
            </div>
            <span className="font-mono-num text-lg font-bold text-neutral-900 dark:text-white">
              {formatTime(timeSeconds)}
            </span>
            {bestTime !== null && (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {t('victory.best', { time: formatTime(bestTime) })}
              </span>
            )}
          </div>

          {/* Mistakes */}
          <div className="flex flex-col items-center justify-center border-x border-neutral-200 dark:border-neutral-700/60 px-2">
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-xs font-medium mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('victory.mistakes')}</span>
            </div>
            <span className="font-mono-num text-lg font-bold text-neutral-900 dark:text-white">
              {mistakesCount}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {mistakesCount === 0 ? t('victory.flawless') : t('victory.completed')}
            </span>
          </div>

          {/* Hints */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-xs font-medium mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{t('victory.hints')}</span>
            </div>
            <span className="font-mono-num text-lg font-bold text-neutral-900 dark:text-white">
              {hintsUsed}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {hintsUsed === 0 ? t('victory.noHints') : t('victory.assisted')}
            </span>
          </div>
        </div>

        {/* Daily Streak Banner */}
        {mode === 'daily' && dailyStreak > 0 && (
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{t('victory.streak', { count: dailyStreak })}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Option to generate a new game of the same level */}
          <button
            id="btn-play-another-same-level"
            type="button"
            onClick={onPlayAnotherSameLevel}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${theme.accentBtn} shadow-md cursor-pointer active:scale-98 transition-transform`}
          >
            <RotateCw className="w-4 h-4" />
            <span>{t('victory.playAnother', { difficulty: diffName(difficulty) })}</span>
          </button>

          {/* Optional next difficulty if available */}
          {nextDiff && onPlayNextDifficulty && (
            <button
              id="btn-play-next-diff"
              type="button"
              onClick={onPlayNextDifficulty}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${theme.controlBtnBg} cursor-pointer active:scale-98 transition-transform`}
            >
              <span>{t('victory.tryNext', { difficulty: diffName(nextDiff) })}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Daily Challenge shortcut */}
          <button
            id="btn-view-daily-challenges"
            type="button"
            onClick={onOpenDailyModal}
            className="w-full py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            {t('victory.viewCalendar')}
          </button>
        </div>
      </div>
    </div>
  );
};
