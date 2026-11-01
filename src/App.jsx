import { useEffect, useMemo, useState } from 'react'
import { getForecast, searchLocations } from './weatherService'
import {
  formatDateTime,
  formatDayLabel,
  formatTemperature,
  formatWind,
  getWeatherMeta,
} from './weather'
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from './storage'
import './styles.css'

const DEFAULT_PLACE = {
  id: 'lagos-default',
  name: 'Lagos',
  admin1: 'Lagos',
  country: 'Nigeria',
  latitude: 6.5244,
  longitude: 3.3792,
  timezone: 'Africa/Lagos',
}

function WeatherGlyph({ code, size = 'medium' }) {
  const meta = getWeatherMeta(code)
  return (
    <span className={`weather-glyph glyph-${meta.glyph} glyph-${size}`} aria-label={meta.label}>
      {meta.icon}
    </span>
  )
}

function StateCard({ kind, onRetry }) {
  const content = {
    loading: {
      eyebrow: 'TUNING INTO THE SKY',
      title: 'Reading the latest conditions…',
      body: 'The forecast desk is checking the atmosphere around your location.',
    },
    error: {
      eyebrow: 'SIGNAL LOST',
      title: 'The forecast is out of reach.',
      body: 'Check your connection, then try the request again. Your saved places are still available.',
    },
    'rate-limit': {
      eyebrow: 'TOO MANY CHECK-INS',
      title: 'The weather station needs a breath.',
      body: 'The provider is rate-limiting requests. Wait a moment, then retry.',
    },
    'no-results': {
      eyebrow: 'NO MATCHES',
      title: 'That place stayed off the map.',
      body: 'Try a city, region, or country name with at least two characters.',
    },
    idle: {
      eyebrow: 'READY WHEN YOU ARE',
      title: 'Search for a place to begin.',
      body: 'Your next forecast will appear here with a clear six-day outlook.',
    },
  }[kind]

  return (
    <section className={`state-card glass-panel state-${kind}`} aria-live="polite">
      <span className="state-orbit" aria-hidden="true">
        {kind === 'loading' ? '◌' : kind === 'error' || kind === 'rate-limit' ? 'ϟ' : '✦'}
      </span>
      <div>
        <p className="eyebrow">{content.eyebrow}</p>
        <h2>{content.title}</h2>
        <p className="state-body">{content.body}</p>
        {['error', 'rate-limit'].includes(kind) && (
          <button className="text-button" onClick={onRetry}>
            Retry request <span>↗</span>
          </button>
        )}
      </div>
    </section>
  )
}

function App() {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES
    return loadPreferences(window.localStorage)
  })
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [place, setPlace] = useState(DEFAULT_PLACE)
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('loading')
  const [lastError, setLastError] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  const unit = preferences.unit
  const favoriteSet = useMemo(
    () => new Set(preferences.favorites.map((favorite) => favorite.toLowerCase())),
    [preferences.favorites],
  )
  const isFavorite = place && favoriteSet.has(place.name.toLowerCase())

  useEffect(() => {
    if (typeof window !== 'undefined') savePreferences(preferences, window.localStorage)
  }, [preferences])

  useEffect(() => {
    loadPlace(DEFAULT_PLACE)
  }, [])

  async function loadPlace(nextPlace) {
    setPlace(nextPlace)
    setWeather(null)
    setStatus('loading')
    setLastError(null)
    try {
      const nextWeather = await getForecast(nextPlace)
      setWeather(nextWeather)
      setStatus('ready')
    } catch (error) {
      setLastError(error)
      setStatus(error.kind === 'rate-limit' ? 'rate-limit' : 'error')
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    if (query.trim().length < 2) {
      setSearchResults([])
      setStatus('no-results')
      return
    }

    setIsSearching(true)
    setLastError(null)
    try {
      const results = await searchLocations(query)
      setSearchResults(results)
      if (!results.length) {
        setWeather(null)
        setStatus('no-results')
        return
      }
      await loadPlace(results[0])
    } catch (error) {
      setLastError(error)
      setStatus(error.kind === 'rate-limit' ? 'rate-limit' : 'error')
    } finally {
      setIsSearching(false)
    }
  }

  function chooseResult(result) {
    setSearchResults([])
    setQuery(result.name)
    loadPlace(result)
  }

  async function openFavorite(name) {
    setQuery(name)
    setSearchResults([])
    setIsSearching(true)
    try {
      const results = await searchLocations(name)
      if (results[0]) await loadPlace(results[0])
      else setStatus('no-results')
    } catch (error) {
      setLastError(error)
      setStatus(error.kind === 'rate-limit' ? 'rate-limit' : 'error')
    } finally {
      setIsSearching(false)
    }
  }

  function toggleFavorite() {
    if (!place) return
    setPreferences((current) => ({
      ...current,
      favorites: isFavorite
        ? current.favorites.filter(
            (favorite) => favorite.toLowerCase() !== place.name.toLowerCase(),
          )
        : [...current.favorites, place.name].slice(-8),
    }))
  }

  function setUnit(nextUnit) {
    setPreferences((current) => ({ ...current, unit: nextUnit }))
  }

  const currentMeta = weather ? getWeatherMeta(weather.current.weatherCode) : null
  const forecastTitle = weather
    ? `${weather.place.name}, ${weather.place.country}`
    : 'Forecast desk'

  return (
    <div className="app-shell">
      <div className="ambient ambient-top" aria-hidden="true" />
      <div className="ambient ambient-side" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="WeatherVue home">
          <span className="brand-mark">◒</span>
          <span className="brand-name">
            Weather<span>Vue</span>
          </span>
          <span className="brand-note">FORECAST DESK</span>
        </a>
        <div className="topbar-meta">
          <span className="provider-status">
            <span className="status-dot" /> LIVE WEATHER DATA
          </span>
          <div className="unit-toggle" role="group" aria-label="Temperature unit">
            <button
              className={unit === 'C' ? 'active' : ''}
              onClick={() => setUnit('C')}
              aria-pressed={unit === 'C'}
            >
              °C
            </button>
            <button
              className={unit === 'F' ? 'active' : ''}
              onClick={() => setUnit('F')}
              aria-pressed={unit === 'F'}
            >
              °F
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="intro-row">
          <div className="intro-copy">
            <p className="eyebrow">
              PERSONAL WEATHER DESK <span className="eyebrow-line" />
            </p>
            <h1>
              Read the sky,
              <br />
              <em>wherever you are.</em>
            </h1>
            <p className="intro-text">
              A calm view of what’s moving overhead — now, next, and across the places you care
              about.
            </p>
          </div>
          <div className="search-wrap">
            <form className="search-bar glass-panel" onSubmit={handleSearch}>
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search city or location"
                aria-label="Search city or location"
              />
              <button type="submit" className="search-submit" disabled={isSearching}>
                {isSearching ? '...' : 'Search'} <span>↗</span>
              </button>
            </form>
            {searchResults.length > 0 && (
              <div className="search-results glass-panel">
                {searchResults.map((result) => (
                  <button
                    key={`${result.id}-${result.latitude}`}
                    onClick={() => chooseResult(result)}
                  >
                    <span>{result.name}</span>
                    <small>{[result.admin1, result.country].filter(Boolean).join(', ')}</small>
                    <span className="result-arrow">↗</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="content-layout">
          <aside className="favorites-panel glass-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">YOUR PLACES</p>
                <h2>Saved locations</h2>
              </div>
              <span className="count-badge">
                {preferences.favorites.length.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="favorites-list">
              {preferences.favorites.length ? (
                preferences.favorites.map((favorite, index) => (
                  <div
                    className={`favorite-row ${place?.name.toLowerCase() === favorite.toLowerCase() ? 'selected' : ''}`}
                    key={favorite}
                  >
                    <button onClick={() => openFavorite(favorite)}>
                      <span className="favorite-index">0{index + 1}</span>
                      <span>{favorite}</span>
                      <span className="favorite-arrow">↗</span>
                    </button>
                    <button
                      className="remove-favorite"
                      onClick={() =>
                        setPreferences((current) => ({
                          ...current,
                          favorites: current.favorites.filter((item) => item !== favorite),
                        }))
                      }
                      aria-label={`Remove ${favorite} from favorites`}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-favorites">
                  Pin a location from the forecast to build your own weather list.
                </p>
              )}
            </div>
            <div className="sidebar-note">
              <span className="note-icon">✦</span>
              <p>
                Forecasts refresh every five minutes so the desk stays light on repeat requests.
              </p>
            </div>
          </aside>

          <div className="forecast-column">
            {status === 'ready' && weather ? (
              <>
                <section className="current-card glass-panel">
                  <div className="current-copy">
                    <div className="location-line">
                      <span className="pin">⌖</span>
                      <span>{forecastTitle}</span>
                      <button
                        className={`favorite-button ${isFavorite ? 'saved' : ''}`}
                        onClick={toggleFavorite}
                        aria-label={
                          isFavorite
                            ? 'Remove current location from favorites'
                            : 'Save current location'
                        }
                      >
                        {isFavorite ? '★' : '☆'}
                      </button>
                    </div>
                    <p className="timestamp">
                      {formatDateTime(weather.current.time, weather.timezone)} <span>•</span>{' '}
                      {weather.timezone.replace('_', ' ')}
                    </p>
                    <div className="current-reading">
                      <span className="temperature">
                        {formatTemperature(weather.current.temperature, unit)}
                      </span>
                      <div>
                        <p className="condition-label">{currentMeta.label}</p>
                        <p className="feels-copy">Feels like a soft start to the day.</p>
                      </div>
                    </div>
                  </div>
                  <div className="current-visual">
                    <div className="sun-ring" />
                    <WeatherGlyph code={weather.current.weatherCode} size="large" />
                    <span className="visual-caption">
                      {weather.current.isDay ? 'DAYLIGHT' : 'NIGHT WATCH'}
                    </span>
                  </div>
                </section>
                <section className="metrics-row" aria-label="Current weather details">
                  <div className="metric glass-panel">
                    <span className="metric-icon">◌</span>
                    <div>
                      <span className="metric-label">HUMIDITY</span>
                      <strong>{weather.current.humidity}%</strong>
                    </div>
                  </div>
                  <div className="metric glass-panel">
                    <span className="metric-icon">≈</span>
                    <div>
                      <span className="metric-label">WIND SPEED</span>
                      <strong>{formatWind(weather.current.windSpeed)}</strong>
                    </div>
                  </div>
                  <div className="metric glass-panel">
                    <span className="metric-icon">↟</span>
                    <div>
                      <span className="metric-label">OUTLOOK</span>
                      <strong>{weather.daily.length} day view</strong>
                    </div>
                  </div>
                </section>
                <section className="outlook-section">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">LOOKING AHEAD</p>
                      <h2>Six-day outlook</h2>
                    </div>
                    <span className="section-rule" />
                  </div>
                  <div className="forecast-grid">
                    {weather.daily.map((day, index) => {
                      const meta = getWeatherMeta(day.weatherCode)
                      return (
                        <article
                          className={`forecast-card glass-panel ${index === 0 ? 'today' : ''}`}
                          key={day.date}
                        >
                          <div className="forecast-top">
                            <span className="day-label">{formatDayLabel(day.date, index)}</span>
                            {index === 0 && <span className="today-dot" />}
                          </div>
                          <WeatherGlyph code={day.weatherCode} size="medium" />
                          <span className="forecast-condition">{meta.label}</span>
                          <div className="forecast-temp">
                            <strong>{formatTemperature(day.max, unit)}</strong>
                            <span>{formatTemperature(day.min, unit)}</span>
                          </div>
                          <div className="rain-chance">
                            <span>PRECIP</span>
                            <b>{day.precipitation ?? 0}%</b>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              </>
            ) : (
              <StateCard kind={status} onRetry={() => loadPlace(place || DEFAULT_PLACE)} />
            )}
          </div>
        </section>
      </main>
      <footer className="footer">
        <span>WEATHERVUE / 01</span>
        <span>Data from Open-Meteo · No account required · Preferences stay in your browser</span>
      </footer>
    </div>
  )
}

export default App
