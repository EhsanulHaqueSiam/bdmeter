import { useState, useCallback } from 'react'

const STORAGE_KEY = 'search_history'
const MAX_ENTRIES = 5

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch { return [] }
}

function persist(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export default function useSearchHistory() {
  const [history, setHistory] = useState(load)

  const addSearch = useCallback((number, provider) => {
    setHistory(prev => {
      const filtered = prev.filter(
        e => !(e.number === String(number) && e.provider === (provider || 'nesco'))
      )
      const next = [
        { number: String(number), provider: provider || 'nesco', timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_ENTRIES)
      persist(next)
      return next
    })
  }, [])

  const getHistory = useCallback(() => history, [history])

  const clearHistory = useCallback(() => {
    persist([])
    setHistory([])
  }, [])

  return { history, addSearch, getHistory, clearHistory }
}
