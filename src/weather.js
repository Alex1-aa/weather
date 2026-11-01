const weatherCodeMap = {
  0: { label: 'Clear sky', glyph: 'sun', icon: '☀' },
  1: { label: 'Mainly clear', glyph: 'sun-cloud', icon: '◒' },
  2: { label: 'Partly cloudy', glyph: 'sun-cloud', icon: '◒' },
  3: { label: 'Overcast', glyph: 'cloud', icon: '☁' },
  45: { label: 'Foggy', glyph: 'fog', icon: '≋' },
  48: { label: 'Rime fog', glyph: 'fog', icon: '≋' },
  51: { label: 'Light drizzle', glyph: 'rain', icon: '╱' },
  53: { label: 'Drizzle', glyph: 'rain', icon: '╱' },
  55: { label: 'Heavy drizzle', glyph: 'rain', icon: '╱' },
  61: { label: 'Light rain', glyph: 'rain', icon: '⋰' },
  63: { label: 'Rain', glyph: 'rain', icon: '⋰' },
  65: { label: 'Heavy rain', glyph: 'rain', icon: '⋰' },
  71: { label: 'Light snow', glyph: 'snow', icon: '✳' },
  73: { label: 'Snow', glyph: 'snow', icon: '✳' },
  75: { label: 'Heavy snow', glyph: 'snow', icon: '✳' },
  80: { label: 'Rain showers', glyph: 'rain', icon: '⋰' },
  81: { label: 'Rain showers', glyph: 'rain', icon: '⋰' },
  82: { label: 'Heavy showers', glyph: 'rain', icon: '⋰' },
  85: { label: 'Snow showers', glyph: 'snow', icon: '✳' },
  86: { label: 'Heavy snow showers', glyph: 'snow', icon: '✳' },
  95: { label: 'Thunderstorm', glyph: 'storm', icon: 'ϟ' },
  96: { label: 'Thunderstorm + hail', glyph: 'storm', icon: 'ϟ' },
  99: { label: 'Thunderstorm + hail', glyph: 'storm', icon: 'ϟ' },
}

export function getWeatherMeta(code) {
  return weatherCodeMap[code] || { label: 'Changing skies', glyph: 'cloud', icon: '☁' }
}

export function celsiusToFahrenheit(value) {
  return (value * 9) / 5 + 32
}

export function formatTemperature(value, unit = 'C') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const converted = unit === 'F' ? celsiusToFahrenheit(Number(value)) : Number(value)
  return `${Math.round(converted)}°`
}

export function formatWind(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Math.round(Number(value))} km/h`
}

export function formatDayLabel(date, index = 0) {
  if (index === 0) return 'Today'
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T12:00:00`))
}

export function formatDateTime(iso, timezone) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    }).format(new Date(iso))
  } catch {
    return new Intl.DateTimeFormat('en', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  }
}
