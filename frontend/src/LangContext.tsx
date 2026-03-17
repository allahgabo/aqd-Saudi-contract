import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang } from './i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  isRTL: boolean;
}

const LangContext = createContext<LangCtx>({ lang: 'en', setLang: () => {}, isRTL: false });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('aqd_lang') as Lang) || 'en';
  });

  const isRTL = lang === 'ar';

  const setLang = (l: Lang) => {
    localStorage.setItem('aqd_lang', l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.style.fontFamily = isRTL
      ? "'Cairo', 'Outfit', sans-serif"
      : "'Outfit', sans-serif";
  }, [lang, isRTL]);

  return (
    <LangContext.Provider value={{ lang, setLang, isRTL }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
