import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LANGUAGE_SWITCHING_ENABLED } from '../config/features';
import type { ReactNode } from 'react';
import {
  detectLanguage,
  persistLanguage,
  translate,
  type AppLanguage,
  type I18nKey,
} from './dictionary';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  t: (key: I18nKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translate('en', key),
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // When switching is enabled, restore the viewer's language preference or
  // detect it from the browser (config/features.ts).
  const [lang, setLangState] = useState<AppLanguage>(() => (LANGUAGE_SWITCHING_ENABLED ? detectLanguage() : 'en'));
  const setLang = useCallback((next: AppLanguage) => {
    if (!LANGUAGE_SWITCHING_ENABLED) return;
    setLangState(next);
    persistLanguage(next);
  }, []);
  const t = useCallback((key: I18nKey) => translate(lang, key), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
