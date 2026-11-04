import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { Difficulty, HintInfo, HintMessageId } from '../types';
import type { MessageKey } from './en';
import { en } from './en';
import { getLanguage, resolveLanguage, type Language, type LanguageSetting } from './languages';

export * from './languages';
export type { MessageKey, Messages } from './en';

type Params = Record<string, string | number>;

export interface I18n {
  language: Language;
  /** Translate a message; {placeholders} are filled from params. Uses the "_one" form when params.count === 1. */
  t: (key: MessageKey, params?: Params) => string;
  difficulty: (d: Difficulty) => string;
  /** e.g. "Nov 4, 2026" / "2026年11月4日" / "2026 nián 11 yuè 4 rì" */
  formatDate: (dateKey: string) => string;
  /** e.g. "November 2026" */
  formatMonthYear: (date: Date) => string;
  hint: (hint: HintInfo) => { title: string; text: string; technique: string };
}

const HINT_TECHNIQUE: Record<HintMessageId, MessageKey> = {
  conflict: 'technique.conflict',
  incorrect: 'technique.errorCheck',
  keyCellBox: 'technique.hiddenSingleBox',
  keyCellRow: 'technique.hiddenSingleRow',
  keyCellCol: 'technique.hiddenSingleCol',
  lockedRow: 'technique.lockedCandidates',
  lockedCol: 'technique.lockedCandidates',
  opportunity: 'technique.peerElimination',
  singleRow: 'technique.hiddenSingleRow',
  singleCol: 'technique.hiddenSingleCol',
  singleBox: 'technique.hiddenSingleBox',
  nakedSingle: 'technique.nakedSingle',
};

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}

export function createI18n(setting: LanguageSetting | undefined): I18n {
  const language = getLanguage(resolveLanguage(setting));
  const messages = language.messages as Record<string, string | undefined>;
  const fallback = en as Record<string, string | undefined>;

  const t = (key: MessageKey, params?: Params): string => {
    const singular = params?.count === 1 ? `${key}_one` : null;
    const template =
      (singular && messages[singular]) ?? messages[key] ?? fallback[key] ?? key;
    return fill(template, params);
  };

  const formatDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!year || !month || !day) return dateKey;
    if (language.intlLocale) {
      try {
        return new Date(year, month - 1, day).toLocaleDateString(language.intlLocale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch {
        // fall through
      }
    }
    return t('date.full', { year, month, day });
  };

  const formatMonthYear = (date: Date): string => {
    if (language.intlLocale) {
      try {
        return date.toLocaleDateString(language.intlLocale, { month: 'long', year: 'numeric' });
      } catch {
        // fall through
      }
    }
    return t('date.monthYear', { year: date.getFullYear(), month: date.getMonth() + 1 });
  };

  return {
    language,
    t,
    difficulty: (d) => t(`difficulty.${d}` as MessageKey),
    formatDate,
    formatMonthYear,
    hint: (h) => {
      // Older hint objects without an ID fall back to their built-in English text.
      if (!h.messageId) return { title: h.title, text: h.explanation, technique: h.technique };
      return {
        title: t(`hint.${h.messageId}.title` as MessageKey, h.params),
        text: t(`hint.${h.messageId}.text` as MessageKey, h.params),
        technique: t(HINT_TECHNIQUE[h.messageId]),
      };
    },
  };
}

const I18nContext = createContext<I18n>(createI18n('en'));

export const I18nProvider: React.FC<{ setting: LanguageSetting | undefined; children: React.ReactNode }> = ({
  setting,
  children,
}) => {
  const value = useMemo(() => createI18n(setting), [setting]);

  // Keep <html lang> in sync so screen readers and fonts pick the right language.
  useEffect(() => {
    document.documentElement.lang = value.language.htmlLang;
  }, [value.language.htmlLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18n => useContext(I18nContext);
