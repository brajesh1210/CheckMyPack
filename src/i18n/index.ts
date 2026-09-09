import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import hi from './hi.json'

export const LANGUAGES = ['en', 'hi'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'cmp_lang'

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'hi' || saved === 'en') return saved
    // Fall back to the device language, which is what a first-time rural user
    // is most likely to want.
    return navigator.language?.startsWith('hi') ? 'hi' : 'en'
  } catch {
    return 'en'
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

/** Switches language and remembers the choice across launches. */
export function setLanguage(lang: Language) {
  void i18n.changeLanguage(lang)
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Private mode; the choice simply will not persist.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language
}

export default i18n
