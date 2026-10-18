import React from 'react';
import { APP_VERSION } from '../version';
import { X, Volume2, Sparkles, Eye, ShieldAlert, Palette, Check } from 'lucide-react';
import { GameSettings, ThemeMode } from '../types';
import { THEMES, ThemeStyles } from '../utils/theme';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
  theme: ThemeStyles;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  theme,
}) => {
  const toggleKey = (key: keyof GameSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const setTheme = (mode: ThemeMode) => {
    onUpdateSettings({
      ...settings,
      theme: mode,
    });
  };

  const toggleMistakeLimit = () => {
    onUpdateSettings({
      ...settings,
      errorLimit: settings.errorLimit === null ? 3 : null,
    });
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="settings-modal-content"
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl ${theme.cardBg} border ${theme.borderColor} shadow-2xl space-y-6 animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Settings & Preferences</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Customize your playing experience</p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Theme & Appearance
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(THEMES) as ThemeMode[]).map((themeKey) => {
              const th = THEMES[themeKey];
              const isSelected = settings.theme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => setTheme(themeKey)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-sky-950/30'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full border border-neutral-700/50 ${
                        themeKey === 'elegant-dark'
                          ? 'bg-[#121212] ring-1 ring-indigo-500/50'
                          : themeKey === 'minimal-light'
                          ? 'bg-neutral-50 border-neutral-300'
                          : themeKey === 'warm-paper'
                          ? 'bg-[#FAF7F2] border-stone-300'
                          : themeKey === 'dark-slate'
                          ? 'bg-slate-950'
                          : 'bg-[#0f1715]'
                      }`}
                    />
                    <span>{th.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gameplay Assists & Visual Helpers */}
        <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Assists & Visual Aids
          </label>

          {/* Sound FX */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold">Sound Effects</span>
              <p className="text-[11px] text-neutral-500">Subtle audio feedback for taps and completions</p>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={() => toggleKey('soundEnabled')}
              className="w-4 h-4 accent-neutral-900 dark:accent-white cursor-pointer"
            />
          </div>

          {/* Auto-remove notes */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold">Auto-Remove Notes</span>
              <p className="text-[11px] text-neutral-500">Automatically clear candidate pencil marks on row/col/box</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoRemoveNotes}
              onChange={() => toggleKey('autoRemoveNotes')}
              className="w-4 h-4 accent-neutral-900 dark:accent-white cursor-pointer"
            />
          </div>

          {/* Highlight matching numbers */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold">Highlight Matching Numbers</span>
              <p className="text-[11px] text-neutral-500">Highlight all identical numbers across the grid</p>
            </div>
            <input
              type="checkbox"
              checked={settings.highlightMatchingNumbers}
              onChange={() => toggleKey('highlightMatchingNumbers')}
              className="w-4 h-4 accent-neutral-900 dark:accent-white cursor-pointer"
            />
          </div>

          {/* Highlight Peers */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold">Highlight Row, Column & Box</span>
              <p className="text-[11px] text-neutral-500">Shade the crosshair peers of the selected cell</p>
            </div>
            <input
              type="checkbox"
              checked={settings.highlightPeers}
              onChange={() => toggleKey('highlightPeers')}
              className="w-4 h-4 accent-neutral-900 dark:accent-white cursor-pointer"
            />
          </div>

          {/* Highlight Duplicates */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold">Check Conflicts & Duplicates</span>
              <p className="text-[11px] text-neutral-500">Flag invalid duplicate numbers instantly</p>
            </div>
            <input
              type="checkbox"
              checked={settings.highlightDuplicates}
              onChange={() => toggleKey('highlightDuplicates')}
              className="w-4 h-4 accent-neutral-900 dark:accent-white cursor-pointer"
            />
          </div>

          {/* 3-Strikes Mistake Limit */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold">3-Strikes Mistake Mode</span>
              <p className="text-[11px] text-neutral-500">
                {settings.errorLimit === 3 ? 'Game over on 3 mistakes' : 'Relaxed mode (unlimited mistakes)'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleMistakeLimit}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                settings.errorLimit === 3
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {settings.errorLimit === 3 ? '3 Strikes' : 'Relaxed'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          id="btn-close-settings"
          type="button"
          onClick={onClose}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold ${theme.accentBtn} cursor-pointer shadow-xs active:scale-95 transition-all`}
        >
          Save & Close
        </button>

        <p className="text-center text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
          RatDoku • ver {APP_VERSION} by MrRat.com
        </p>
      </div>
    </div>
  );
};
