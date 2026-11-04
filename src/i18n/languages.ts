import { en, type Messages } from './en';
import { zh } from './zh';
import { pinyin } from './pinyin';

/**
 * Every language the game can show.
 *
 * To add a language:
 *   1. Copy en.ts to e.g. es.ts and translate the values (keep the keys and {placeholders}).
 *      Type it as `Messages` so the type-check flags any missing text.
 *   2. Add an entry below. `matches` decides which device languages pick it automatically.
 */
export const LANGUAGES = [
  {
    code: 'en',
    nativeName: 'English',
    htmlLang: 'en',
    intlLocale: 'en-US',
    messages: en as Messages,
    matches: (tag: string) => tag.startsWith('en'),
  },
  {
    code: 'zh',
    nativeName: '中文',
    htmlLang: 'zh-Hans',
    intlLocale: 'zh-CN',
    messages: zh,
    matches: (tag: string) => tag.startsWith('zh'),
  },
  {
    code: 'pinyin',
    nativeName: 'Pīnyīn',
    htmlLang: 'zh-Latn-pinyin',
    // No Intl locale writes dates in Pinyin, so dates use the 'date.*' messages instead.
    intlLocale: undefined,
    messages: pinyin,
    // Never chosen automatically; Chinese devices get characters (zh).
    matches: () => false,
  },
] as const satisfies readonly {
  code: string;
  nativeName: string;
  htmlLang: string;
  intlLocale: string | undefined;
  messages: Messages;
  matches: (tag: string) => boolean;
}[];

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type LanguageSetting = 'auto' | LanguageCode;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/** Picks the first of the device's preferred languages that the game supports. */
export function detectDeviceLanguage(): LanguageCode {
  try {
    const tags =
      typeof navigator !== 'undefined'
        ? navigator.languages?.length
          ? navigator.languages
          : [navigator.language]
        : [];
    for (const raw of tags) {
      const tag = (raw || '').toLowerCase();
      const hit = LANGUAGES.find((l) => l.matches(tag));
      if (hit) return hit.code;
    }
  } catch {
    // fall through to the default
  }
  return DEFAULT_LANGUAGE;
}

export function resolveLanguage(setting: LanguageSetting | undefined): LanguageCode {
  if (setting && setting !== 'auto' && LANGUAGES.some((l) => l.code === setting)) return setting;
  return detectDeviceLanguage();
}
