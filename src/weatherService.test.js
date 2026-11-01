import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearWeatherCache, getForecast, searchLocations } from './weatherService'

const place = { id: 1, name: 'Lagos', country: 'Nigeria', latitude: 6.524, longitude: 3.379, timezone: 'Africa/Lagos' }

beforeEach(() => {
  clearWeatherCache()
  vi.restoreAllMocks()
})

describe('weather service', () => {
  it('returns an empty list for an invalid short location query', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await searchLocations('L')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps mocked geocoding and forecast responses into dashboard data', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ id: 1, name: 'Lagos', country: 'Nigeria', latitude: 6.524, longitude: 3.379, timezone: 'Africa/Lagos' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ timezone: 'Africa/Lagos', current: { time: '2026-01-01T12:00', temperature_2m: 29, relative_humidity_2m: 70, wind_speed_10m: 12, weather_code: 1, is_day: 1 }, daily: { time: ['2026-01-01'], weather_code: [1], temperature_2m_max: [31], temperature_2m_min: [25], precipitation_probability_max: [10], sunrise: ['2026-01-01T06:30'], sunset: ['2026-01-01T18:00'] } }) }))

    const locations = await searchLocations('Lagos')
    const forecast = await getForecast(locations[0])
    expect(forecast.current.temperature).toBe(29)
    expect(forecast.daily[0].max).toBe(31)
  })

  it('deduplicates concurrent forecast requests for the same coordinates', async () => {
    const response = { ok: true, json: async () => ({ timezone: 'Africa/Lagos', current: { time: '', temperature_2m: 29, relative_humidity_2m: 70, wind_speed_10m: 12, weather_code: 0, is_day: 1 }, daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_probability_max: [], sunrise: [], sunset: [] } }) }
    const fetchMock = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve(response), 10)))
    vi.stubGlobal('fetch', fetchMock)

    await Promise.all([getForecast(place), getForecast(place)])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces provider failures for a retry state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }))
    await expect(searchLocations('Lagos')).rejects.toMatchObject({ kind: 'api', status: 503 })
  })
})
