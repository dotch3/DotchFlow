// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  'pt-BR': { translation: ptBR }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pt-BR'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dotchflow_language'
    }
  });

export default i18n;

// Helper functions
export const changeLanguage = async (language, api) => {
  try {
    const response = await api.put('/auth/language', { language });
    // Update localStorage for i18next
    localStorage.setItem('dotchflow_language', language);
    i18n.changeLanguage(language);
    return response.data.user;
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
};

export const getSupportedLanguages = () => [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' }
];
