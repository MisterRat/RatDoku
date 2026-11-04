import React from 'react';
import { APP_VERSION } from '../version';
import {
  Play,
  Pause,
  RotateCcw,
  Calendar,
  BarChart3,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Flame,
  Plus,
} from 'lucide-react';
import { Difficulty, GameMode } from '../types';
import { formatTime } from '../utils/storage';
import { ThemeStyles } from '../utils/theme';
import { useI18n } from '../i18n';

interface HeaderProps {
  difficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  mode: GameMode;
  dateKey?: string;
  onSelectDaily: () => void;
  onSelectClassic: () => void;
  onNewGame: () => void;
  onRestartCurrentGame: () => void;
  timerSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  mistakesCount: number;
  errorLimit: number | null;
  dailyStreak: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
  onOpenDailyModal: () => void;
  onOpenSettings: () => void;
  theme: ThemeStyles;
}

export const Header: React.FC<HeaderProps> = ({
  difficulty,
  onChangeDifficulty,
  mode,
  dateKey,
  onSelectDaily,
  onSelectClassic,
  onNewGame,
  onRestartCurrentGame,
  timerSeconds,
  isPaused,
  onTogglePause,
  mistakesCount,
  errorLimit,
  dailyStreak,
  soundEnabled,
  onToggleSound,
  onOpenStats,
  onOpenDailyModal,
  onOpenSettings,
  theme,
}) => {
  const { t, difficulty: diffName } = useI18n();
  return (
    <header className="w-full max-w-[540px] mx-auto space-y-3 px-2 sm:px-4 pt-3 sm:pt-4">
      {/* Top Level Brand & Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center font-bold text-sm shadow-sm">
            9
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-light tracking-[0.18em] leading-none text-white">
              RAT<span className="font-bold text-indigo-400">DOKU</span>
            </h1>
            <p className="text-[10px] tracking-wider text-slate-400 dark:text-slate-500 font-medium leading-none mt-1">
              {t('header.version', { version: APP_VERSION })}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {dailyStreak > 0 && (
            <button
              id="header-daily-streak-btn"
              type="button"
              onClick={onOpenDailyModal}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-900/50 cursor-pointer hover:bg-amber-100 transition-colors"
              title={t('header.streakTitle', { count: dailyStreak })}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{dailyStreak}</span>
            </button>
          )}

          <button
            id="btn-calendar"
            type="button"
            onClick={onOpenDailyModal}
            className={`p-2 rounded-lg ${theme.controlBtnBg} cursor-pointer hover:opacity-80 transition-opacity`}
            title={t('header.calendar')}
            aria-label={t('header.calendar')}
          >
            <Calendar className="w-4 h-4" />
          </button>

          <button
            id="btn-stats"
            type="button"
            onClick={onOpenStats}
            className={`p-2 rounded-lg ${theme.controlBtnBg} cursor-pointer hover:opacity-80 transition-opacity`}
            title={t('header.stats')}
            aria-label={t('header.stats')}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            id="btn-sound-toggle"
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-lg ${theme.controlBtnBg} cursor-pointer hover:opacity-80 transition-opacity`}
            title={soundEnabled ? t('header.mute') : t('header.unmute')}
            aria-label={soundEnabled ? t('header.mute') : t('header.unmute')}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>

          <button
            id="btn-settings"
            type="button"
            onClick={onOpenSettings}
            className={`p-2 rounded-lg ${theme.controlBtnBg} cursor-pointer hover:opacity-80 transition-opacity`}
            title={t('header.settings')}
            aria-label={t('header.settings')}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode & Difficulty Selector Row */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 pt-0.5">
        {/* Difficulty buttons */}
        <div className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70 backdrop-blur-sm gap-0.5 sm:gap-1 shrink-0">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
            const isActive = difficulty === d;
            return (
              <button
                key={d}
                id={`diff-tab-${d}`}
                type="button"
                onClick={() => onChangeDifficulty(d)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold capitalize transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {diffName(d)}
              </button>
            );
          })}
        </div>

        {/* Mode Toggle & New Game */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            id="btn-mode-toggle"
            type="button"
            onClick={() => (mode === 'daily' ? onSelectClassic() : onSelectDaily())}
            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium border transition-colors cursor-pointer ${
              mode === 'daily'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
                : `${theme.controlBtnBg}`
            }`}
          >
            {mode === 'daily' ? t('header.daily') : t('header.classic')}
          </button>

          <button
            id="btn-new-game"
            type="button"
            onClick={onNewGame}
            className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium ${theme.accentBtn} cursor-pointer transition-all shadow-xs active:scale-95`}
            title={t('header.newTitle')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('header.new')}</span>
          </button>

          <button
            id="btn-restart-game"
            type="button"
            onClick={onRestartCurrentGame}
            className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg ${theme.controlBtnBg} cursor-pointer hover:opacity-80 transition-opacity`}
            title={t('header.restart')}
            aria-label={t('header.restart')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timer & Performance Status Bar */}
      <div className={`flex items-center justify-between py-2 px-4 rounded-xl ${theme.subtleBg} border ${theme.borderColor} text-xs`}>
        {/* Mistakes */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{t('header.mistakes')}</span>
          <span className={`font-mono text-base font-semibold ${mistakesCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {errorLimit ? `${mistakesCount} / ${errorLimit}` : mistakesCount}
          </span>
        </div>

        {/* Live Timer */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{t('header.time')}</span>
            <span className="font-mono text-base font-semibold text-indigo-300 tracking-wider">
              {formatTime(timerSeconds)}
            </span>
          </div>
          <button
            id="btn-timer-pause"
            type="button"
            onClick={onTogglePause}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
            title={isPaused ? t('header.resume') : t('header.pause')}
            aria-label={isPaused ? t('header.resume') : t('header.pause')}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
