import { describe, expect, it } from 'vitest'
import { celsiusToFahrenheit, formatTemperature, getWeatherMeta } from './weather'
import { loadPreferences, normalizePreferences, savePreferences } from './storage'

describe('weather formatting', () => {
  it('converts Celsius to Fahrenheit and formats the display', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
    expect(formatTemperature(20, 'F')).toBe('68°')
    expect(formatTemperature(20, 'C')).toBe('20°')
  })

  it('maps provider condition codes to readable weather metadata', () => {
    expect(getWeatherMeta(0).label).toBe('Clear sky')
    expect(getWeatherMeta(95).glyph).toBe('storm')
    expect(getWeatherMeta(999).label).toBe('Changing skies')
  })
})

describe('preference persistence', () => {
  it('normalizes units and removes duplicate or malformed favorites', () => {
    expect(normalizePreferences({ unit: 'F', favorites: ['Lagos', 'Lagos', '', 4] })).toEqual({
      unit: 'F',
      favorites: ['Lagos'],
    })
    expect(normalizePreferences(null)).toEqual({ unit: 'C', favorites: [] })
  })

  it('round-trips the unit and favorites through a localStorage-compatible store', () => {
    const values = new Map()
    const storage = {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    }
    savePreferences({ unit: 'F', favorites: ['Lagos', 'Abuja'] }, storage)
    expect(loadPreferences(storage)).toEqual({ unit: 'F', favorites: ['Lagos', 'Abuja'] })
  })
})
