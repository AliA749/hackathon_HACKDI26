# Ummah Local NJ

A geolocation-based discovery platform for Muslim-owned and Muslim-serving
businesses across New Jersey. Users browse a map, see business pins, and drop
their own pin with a short listing - no account required.

See [`PRD.md`](PRD.md) for the full product requirements document.

## Architecture

```text
frontend/                React + Vite + react-leaflet (port 5173, dev)
  Leaflet map locked to a New Jersey bounding box
  Search bar (keyword + category) over the current map view
  Click-to-post modal -> POST /api/listings
  Vite dev server proxies /api/* to the backend, no CORS setup needed in dev

muslim-local-nj/         Spring Boot backend (port 8080)
  /api/listings REST controller (list/search + create)
  Jakarta Bean Validation, incl. shared New Jersey coordinate bounds
  Spring Data JPA repository with an optional-filter search query
  Postgres via docker-compose for local dev
```

## Local Run

**1. Start Postgres:**

```powershell
cd muslim-local-nj
docker compose up -d
```

**2. Start the backend** (talks to Postgres on localhost:5432, see
`application.properties` for overridable env vars):

```powershell
cd muslim-local-nj
.\mvnw.cmd spring-boot:run
```

**3. Start the frontend:**

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` calls to
the backend on `:8080`.

## Demo Flow

1. Open the app - map loads centered on New Jersey, existing pins appear.
2. Search by keyword or category to filter what's on the map and in the list.
3. Click anywhere inside New Jersey to open the posting form.
4. Fill out the business form and publish - the pin appears immediately.
5. Pan/zoom the map or click a directory card to jump between listings.

## API

`GET /api/geo/nj-boundary`

Returns the New Jersey outline as GeoJSON. The frontend uses it both to draw
the coverage area and to reject clicks outside the state.

`GET /api/listings`

Optional query params, all combinable: `minLat`, `maxLat`, `minLng`, `maxLng`
(pins in the current map view), `q` (keyword search over business name and
description), `category` (exact match against `BusinessCategory`). No params
returns everything, newest first.

`POST /api/listings`

```json
{
  "ownerName": "Mohammad Shaheer Siddiqi",
  "businessName": "Shaheer Barber Studio",
  "category": "BARBER",
  "comment": "Local barber studio welcoming Muslim clients across central New Jersey.",
  "websiteUrl": "https://example.com",
  "latitude": 40.5187,
  "longitude": -74.4121
}
```

A validation failure (e.g. coordinates outside New Jersey) returns `400` with
a field-level `errors` map instead of a generic error page.

## Notable Decisions

- **No login/signup.** Posting is anonymous-by-name (`ownerName` is free
  text). This trades away moderation/spam control for zero auth-flow build
  time - see `PRD.md` for the tradeoff and the moderation follow-ups it
  implies.
- **New Jersey bounds live in exactly two places** and must stay identical:
  `muslim-local-nj/.../listing/NjBounds.java` (backend validation) and
  `frontend/src/constants/bounds.js` (map click-eligible area). A previous
  mismatch between these two is what caused pins near the state border to
  silently fail to save.
- **Map tiles use Stadia's "OSM Bright"**, not `tile.openstreetmap.org`
  directly - the latter throttles/blocks under shared-network hackathon
  traffic, which showed up as blank gray tiles ("ghosting") when panning.
  CARTO's free raster tiles are **not** a substitute: they now stamp
  "API KEY REQUIRED" across every image. Stadia is keyless on `localhost`;
  for a public domain, get a free key at <https://client.stadiamaps.com/signup/>
  and append `?api_key=YOUR_KEY` to the tile URL.
- **`leaflet.css` is loaded from a CDN with an SRI hash** in
  `frontend/index.html`. If that hash is ever wrong the browser silently
  discards the stylesheet, and Leaflet renders as scattered tiles with dead
  zoom controls - it looks like a tile-server problem but is not. The
  correct 1.9.4 hash is `sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=`.

## Team Split

- Backend: listing model, validation, REST API, persistence, search.
- Frontend (x2): map UX, search/filter UI, posting composer, responsive
  layout and visual design.

## Future Enhancements

- Optional owner accounts for editing/removing your own listing.
- Moderation queue / report button now that anyone can post.
- Photo uploads and verified/claimed business badges.
- Flyway/Liquibase migrations instead of `ddl-auto=update`.
