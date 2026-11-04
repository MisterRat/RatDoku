import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Check, Play, Flame, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Difficulty } from '../types';
import { loadDailyRecords, getTodayDateKey, formatTime } from '../utils/storage';
import { ThemeStyles } from '../utils/theme';
import { useI18n } from '../i18n';

interface DailyChallengeModalProps {
  onSelectDailyGame: (dateKey: string, difficulty: Difficulty) => void;
  onClose: () => void;
  currentDateKey: string;
  dailyStreak: number;
  theme: ThemeStyles;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  onSelectDailyGame,
  onClose,
  currentDateKey,
  dailyStreak,
  theme,
}) => {
  const { t, difficulty: diffName, formatDate, formatMonthYear } = useI18n();
  const todayKey = getTodayDateKey();
  const [selectedDate, setSelectedDate] = useState<string>(currentDateKey || todayKey);
  const records = loadDailyRecords();

  // Get days in current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDay = now.getDate();

  const monthName = formatMonthYear(now);

  const getRecordForDay = (dayNum: number, diff: Difficulty) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return records[`${dStr}-${diff}`];
  };

  const isDayFullyCompleted = (dayNum: number) => {
    return (
      Boolean(getRecordForDay(dayNum, 'easy')?.completed) &&
      Boolean(getRecordForDay(dayNum, 'medium')?.completed) &&
      Boolean(getRecordForDay(dayNum, 'hard')?.completed)
    );
  };

  const isDayPartiallyCompleted = (dayNum: number) => {
    return (
      Boolean(getRecordForDay(dayNum, 'easy')?.completed) ||
      Boolean(getRecordForDay(dayNum, 'medium')?.completed) ||
      Boolean(getRecordForDay(dayNum, 'hard')?.completed)
    );
  };

  return (
    <div
      id="daily-challenge-modal-backdrop"
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="daily-challenge-modal-content"
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl ${theme.cardBg} border ${theme.borderColor} shadow-2xl space-y-5 animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{t('daily.title')}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('daily.subtitle')}
              </p>
            </div>
          </div>
          <button
            id="btn-close-daily-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak Stats Card */}
        <div className={`flex items-center justify-between p-3.5 rounded-xl ${theme.subtleBg} border ${theme.borderColor}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-500">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{t('daily.streak')}</span>
              <p className="text-base font-bold text-neutral-900 dark:text-white">
                {t('daily.days', { count: dailyStreak })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{t('daily.month')}</span>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{monthName}</p>
          </div>
        </div>

        {/* Today's 3 Challenges Card */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {selectedDate === todayKey ? t('daily.today') : t('daily.puzzlesFor', { date: formatDate(selectedDate) })}
            </h4>
            <span className="text-xs text-neutral-500 font-mono-num">{selectedDate}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
              const record = records[`${selectedDate}-${diff}`];
              const isDone = Boolean(record?.completed);

              const diffColors = {
                easy: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
                medium: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
                hard: 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400',
              };

              return (
                <div
                  key={diff}
                  className={`p-3 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${diffColors[diff]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide">{diffName(diff)}</span>
                    {isDone ? (
                      <span className="p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-semibold text-neutral-500">{t('daily.ready')}</span>
                    )}
                  </div>

                  <div>
                    {isDone ? (
                      <div className="text-xs">
                        <div className="text-neutral-500 dark:text-neutral-400 text-[10px]">{t('daily.solvedIn')}</div>
                        <div className="font-mono-num font-bold text-sm text-neutral-900 dark:text-white">
                          {formatTime(record.timeSeconds)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t('daily.unsolved')}
                      </div>
                    )}
                  </div>

                  <button
                    id={`btn-play-daily-${selectedDate}-${diff}`}
                    type="button"
                    onClick={() => {
                      onSelectDailyGame(selectedDate, diff);
                      onClose();
                    }}
                    className={`w-full py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all ${
                      isDone
                        ? 'bg-white/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-white'
                        : `${theme.accentBtn}`
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isDone ? t('daily.replay') : t('daily.play')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Days of Month Grid */}
        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {t('daily.calendar')}
            </h4>
            <span className="text-[11px] text-neutral-400">{t('daily.tapDate')}</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dayNum === todayDay;
              const isFuture = dayNum > todayDay;
              const isSelected = selectedDate === dayStr;
              const isComplete = isDayFullyCompleted(dayNum);
              const isPartial = isDayPartiallyCompleted(dayNum);

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isFuture}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isFuture
                      ? 'opacity-30 cursor-not-allowed text-neutral-400'
                      : 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  } ${
                    isSelected
                      ? 'ring-2 ring-blue-500 font-bold bg-blue-50 dark:bg-blue-950/40'
                      : ''
                  } ${
                    isToday && !isSelected
                      ? 'border border-amber-400 text-amber-700 dark:text-amber-300 font-bold'
                      : ''
                  }`}
                >
                  <span className="font-mono-num text-xs">{dayNum}</span>
                  <div className="flex gap-0.5 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        getRecordForDay(dayNum, 'easy')?.completed ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        getRecordForDay(dayNum, 'medium')?.completed ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        getRecordForDay(dayNum, 'hard')?.completed ? 'bg-rose-500' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
