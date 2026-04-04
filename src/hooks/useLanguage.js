import { useState, useCallback } from 'react'
import translations from '../i18n'

const STORAGE_KEY = 'lang'

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'bn' || stored === 'en') return stored
  } catch {}
  return 'en'
}

export default function useLanguage() {
  const [lang, setLangState] = useState(getInitialLang)

  const setLang = useCallback((newLang) => {
    setLangState(newLang)
    try { localStorage.setItem(STORAGE_KEY, newLang) } catch {}
  }, [])

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en?.[key] || key
  }, [lang])

  return { lang, setLang, t }
}
