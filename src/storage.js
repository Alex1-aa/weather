export const STORAGE_KEY = 'weathervue-preferences'

export const DEFAULT_PREFERENCES = {
  unit: 'C',
  favorites: [],
}

export function normalizePreferences(value) {
  const unit = value?.unit === 'F' ? 'F' : 'C'
  const favorites = Array.isArray(value?.favorites)
    ? [...new Set(value.favorites.filter((favorite) => typeof favorite === 'string' && favorite.trim()))].slice(0, 8)
    : []

  return { unit, favorites }
}

export function loadPreferences(storage) {
  if (!storage) return { ...DEFAULT_PREFERENCES }

  try {
    return normalizePreferences(JSON.parse(storage.getItem(STORAGE_KEY) || 'null'))
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(preferences, storage) {
  if (!storage) return
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizePreferences(preferences)))
}
