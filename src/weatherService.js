const CACHE_TTL = 5 * 60 * 1000
const GEOCODE_TTL = 10 * 60 * 1000
const geocodeCache = new Map()
const forecastCache = new Map()
const inFlight = new Map()

async function fetchJson(url) {
  const response = await fetch(url)
  if (response.status === 429) {
    const error = new Error(
      'The weather provider is rate-limiting requests. Please wait a moment and try again.',
    )
    error.kind = 'rate-limit'
    throw error
  }
  if (!response.ok) {
    const error = new Error('The weather provider could not complete that request.')
    error.kind = 'api'
    error.status = response.status
    throw error
  }
  return response.json()
}

export async function searchLocations(query) {
  const normalized = query.trim().toLowerCase()
  if (normalized.length < 2) return []

  const cached = geocodeCache.get(normalized)
  if (cached && Date.now() - cached.timestamp < GEOCODE_TTL) return cached.value

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.search = new URLSearchParams({
    name: query.trim(),
    count: '5',
    language: 'en',
    format: 'json',
  })
  const data = await fetchJson(url)
  const value = (data.results || []).map((result) => ({
    id: result.id,
    name: result.name,
    admin1: result.admin1 || '',
    country: result.country || '',
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || 'auto',
  }))

  geocodeCache.set(normalized, { timestamp: Date.now(), value })
  return value
}

export async function getForecast(place) {
  const key = `${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`
  const cached = forecastCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.value
  if (inFlight.has(key)) return inFlight.get(key)

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    forecast_days: '6',
    timezone: 'auto',
  })

  const request = fetchJson(url)
    .then((data) => {
      const value = {
        place,
        timezone: data.timezone,
        current: {
          time: data.current?.time,
          temperature: data.current?.temperature_2m,
          humidity: data.current?.relative_humidity_2m,
          windSpeed: data.current?.wind_speed_10m,
          weatherCode: data.current?.weather_code,
          isDay: data.current?.is_day,
        },
        daily: (data.daily?.time || []).map((date, index) => ({
          date,
          weatherCode: data.daily.weather_code[index],
          max: data.daily.temperature_2m_max[index],
          min: data.daily.temperature_2m_min[index],
          precipitation: data.daily.precipitation_probability_max[index],
          sunrise: data.daily.sunrise[index],
          sunset: data.daily.sunset[index],
        })),
      }
      forecastCache.set(key, { timestamp: Date.now(), value })
      return value
    })
    .finally(() => inFlight.delete(key))

  inFlight.set(key, request)
  return request
}

export function clearWeatherCache() {
  forecastCache.clear()
  geocodeCache.clear()
  inFlight.clear()
}
