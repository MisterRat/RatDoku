import React from 'react';
import { Lightbulb, X, Check } from 'lucide-react';
import { HintInfo } from '../types';
import { ThemeStyles } from '../utils/theme';
import { useI18n } from '../i18n';

interface HintBarProps {
  hint: HintInfo;
  onApplyHint: () => void;
  onDismiss: () => void;
  theme: ThemeStyles;
}

export const HintBar: React.FC<HintBarProps> = ({
  hint,
  onApplyHint,
  onDismiss,
  theme,
}) => {
  const { t, hint: describeHint } = useI18n();
  const text = describeHint(hint);
  return (
    <div
      id="sudoku-hint-card"
      className="w-full max-w-[490px] mx-auto p-3.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 shadow-md text-amber-950 dark:text-amber-100 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-amber-900 dark:text-amber-200">
                {text.title}
              </h4>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-800/60 text-amber-800 dark:text-amber-300">
                {text.technique}
              </span>
            </div>
          </div>
        </div>

        <button
          id="btn-dismiss-hint"
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 cursor-pointer"
          title={t('hint.dismiss')}
          aria-label={t('hint.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-200/90 mt-2 leading-relaxed">
        {text.text}
      </p>

      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-amber-200 dark:border-amber-800/60">
        <button
          id="btn-dismiss-hint-secondary"
          type="button"
          onClick={onDismiss}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{t('hint.gotIt')}</span>
        </button>
      </div>
    </div>
  );
};
