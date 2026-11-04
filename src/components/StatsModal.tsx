import React, { useState } from 'react';
import { X, BarChart3, Trophy, Flame, Clock, Award } from 'lucide-react';
import { Difficulty, OverallStats } from '../types';
import { formatTime } from '../utils/storage';
import { ThemeStyles } from '../utils/theme';
import { useI18n } from '../i18n';

interface StatsModalProps {
  stats: OverallStats;
  onClose: () => void;
  theme: ThemeStyles;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose, theme }) => {
  const { t, difficulty: diffName } = useI18n();
  const [activeTab, setActiveTab] = useState<Difficulty>('medium');
  const currentDiffStats = stats[activeTab];

  const winRate =
    currentDiffStats.gamesPlayed > 0
      ? Math.round((currentDiffStats.gamesWon / currentDiffStats.gamesPlayed) * 100)
      : 0;

  return (
    <div
      id="stats-modal-backdrop"
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="stats-modal-content"
        className={`w-full max-w-md p-6 rounded-2xl ${theme.cardBg} border ${theme.borderColor} shadow-2xl space-y-5 animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{t('stats.title')}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('stats.subtitle')}</p>
            </div>
          </div>
          <button
            id="btn-close-stats-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty switcher tabs */}
        <div className="flex p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 gap-1">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setActiveTab(d)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === d
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              {diffName(d)}
            </button>
          ))}
        </div>

        {/* Main Stats 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className={`p-3.5 rounded-xl ${theme.subtleBg} border ${theme.borderColor}`}>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('stats.gamesWon')}</span>
            </div>
            <div className="font-mono-num text-2xl font-bold text-neutral-900 dark:text-white">
              {currentDiffStats.gamesWon}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {t('stats.gamesPlayed', { played: currentDiffStats.gamesPlayed, rate: winRate })}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl ${theme.subtleBg} border ${theme.borderColor}`}>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('stats.bestTime')}</span>
            </div>
            <div className="font-mono-num text-2xl font-bold text-neutral-900 dark:text-white">
              {currentDiffStats.bestTime !== null ? formatTime(currentDiffStats.bestTime) : '--:--'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {t('stats.average', {
                time: currentDiffStats.averageTime !== null ? formatTime(currentDiffStats.averageTime) : '--:--',
              })}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl ${theme.subtleBg} border ${theme.borderColor}`}>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>{t('stats.currentStreak')}</span>
            </div>
            <div className="font-mono-num text-2xl font-bold text-neutral-900 dark:text-white">
              {currentDiffStats.currentStreak}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {t('stats.bestStreak', { count: currentDiffStats.bestStreak })}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl ${theme.subtleBg} border ${theme.borderColor}`}>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <Award className="w-3.5 h-3.5 text-purple-500" />
              <span>{t('stats.dailyStreak')}</span>
            </div>
            <div className="font-mono-num text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.dailyStreak}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{t('stats.consecutive')}</div>
          </div>
        </div>

        {/* Close Button */}
        <button
          id="btn-close-stats"
          type="button"
          onClick={onClose}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold ${theme.accentBtn} cursor-pointer shadow-xs active:scale-95 transition-all`}
        >
          {t('stats.done')}
        </button>
      </div>
    </div>
  );
};
