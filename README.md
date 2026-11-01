# WeatherVue Forecast

WeatherVue is a responsive React weather dashboard with an atmospheric glass visual language. It uses Open-Meteo for keyless geocoding and forecast data, so the static frontend never contains a provider secret.

## Run locally

```bash
npm install
npm run dev
```

The production build is a static Vite output:

```bash
npm run build
npm run preview
```

The managed deployment uses `dist` as the static output directory. `public/manus-routes.json` declares the single `/` route for the host.

## API dependency and request strategy

The app calls `https://geocoding-api.open-meteo.com/v1/search` to resolve a city or location, then calls `https://api.open-meteo.com/v1/forecast` for current conditions and six daily records. Open-Meteo is used because this scope does not need a secret key or a backend proxy. If a private provider is chosen later, move the two provider calls into a small server endpoint and keep credentials in server-side environment variables.

Forecast responses are cached in memory for five minutes, geocoding results for ten minutes, and an in-flight request map deduplicates concurrent calls for the same coordinates. A production-scale version could add an HTTP cache or service worker, plus exponential backoff for rate limits. A 429 response is surfaced as a dedicated retry state rather than retried in a tight loop.

## Storage model

The only persisted client data is the `weathervue-preferences` localStorage record:

```json
{
  "unit": "C",
  "favorites": ["Lagos", "Ilorin", "Abuja"]
}
```

There is no database because the product has no accounts, shared records, or cross-device synchronization requirement. `localStorage` survives browser restarts and is scoped to the origin; `sessionStorage` is also origin-scoped but is cleared when its browser tab/session ends. If accounts were added, a backend would own user identity and synchronized favorites, with optimistic UI updates and local caching for offline reads.

## Tests

The test suite uses Vitest and focuses on pure weather formatting, storage normalization, mocked geocoding/forecast responses, and request deduplication. Responsive behavior is implemented with CSS breakpoints at desktop, tablet, and mobile widths and should be smoke-tested in the Preview viewport controls.

```bash
npm test
```
