import React, { createContext, useContext, useState, useCallback } from 'react';
import en from './en.json';
import es from './es.json';

const translations = { en, es };
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    if (saved && translations[saved]) return saved;
    const browserLang = navigator.language.slice(0, 2);
    return translations[browserLang] ? browserLang : 'en';
  });

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  }, []);

  return (
    <I18nContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}