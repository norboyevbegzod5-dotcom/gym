import i18n from 'i18next';
import { initReactI18next, useTranslation as useI18nTranslation } from 'react-i18next';

import ru from '@/locales/ru.json';
import uz from '@/locales/uz.json';

// Получаем язык из Telegram или localStorage
const getTelegramLanguage = (): string => {
  const tg = window.Telegram?.WebApp;
  const userLang = tg?.initDataUnsafe?.user?.language_code;
  
  // Поддерживаемые языки
  const supportedLanguages = ['ru', 'uz', 'en'];
  
  if (userLang && supportedLanguages.includes(userLang)) {
    return userLang;
  }
  
  return localStorage.getItem('language') || 'ru';
};

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
    // en: { translation: en }, // добавить при необходимости
  },
  lng: getTelegramLanguage(),
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
});

// Функция смены языка с сохранением
export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
  
  // TODO: отправить на backend для сохранения в БД
  // await api.updateUserLanguage(lang);
};

// Получить текущий язык
export const getCurrentLanguage = () => i18n.language;

// Доступные языки
export const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  // { code: 'en', name: 'English', flag: '🇬🇧' },
];

// Экспорт хука с типами
export const useTranslation = useI18nTranslation;

export default i18n;
