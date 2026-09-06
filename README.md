# Ummah Local NJ

A geolocation-based discovery platform for Muslim-owned and Muslim-serving
businesses across New Jersey. Users browse a map, see business pins, and drop
their own pin with a short listing - no account required.

See [`PRD.md`](PRD.md) for the full product requirements document.

**For judging:** [`JUDGE_QA.md`](JUDGE_QA.md) is the anticipated-questions prep
sheet, and [`PROJECT_REPORT.md`](PROJECT_REPORT.md) is the full build report -
architecture, tools, timeline, decisions, metrics, and known gaps.

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

```powershell
.\start-dev.ps1
```

That's the whole thing. It builds the backend jar if `src/main` changed,
installs frontend deps if missing, starts both servers, waits for them to
answer, and opens a browser tab. Stop it with `.\stop-dev.ps1`.

Measured on a Windows 11 laptop: **~7 s** when the jar is current, **~10 s**
when it has to rebuild. Roughly 6 s of that is Spring Boot's own startup; Vite
is ready in ~215 ms.

Requirements are Java 21+ and Node 18+. **No Docker, no Postgres, no env
vars** - the backend defaults to a file-backed H2 database in
`muslim-local-nj/data/`.

Useful flags:

```powershell
.\start-dev.ps1 -Db ./data/vertwo   # use your own scratch database
.\start-dev.ps1 -Rebuild            # force a clean backend rebuild
.\start-dev.ps1 -NoBrowser          # don't open a tab
```

<details>
<summary>Running the pieces by hand, or against Postgres</summary>

```powershell
cd muslim-local-nj
.\mvnw.cmd spring-boot:run           # backend on :8080, H2

cd frontend
npm install
npm run dev                          # frontend on :5173
```

For Postgres instead of H2 (a shared team database, or a production-like
deploy), start the container and activate the `postgres` profile:

```powershell
cd muslim-local-nj
docker compose up -d
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=postgres"
```

If you run the Vite dev server inside WSL against this project on `/mnt/c`,
set `VITE_USE_POLLING=1` - Windows-side edits emit no inotify events WSL can
see, so without it the watcher misses every change. Leave it unset when
running natively on Windows; polling costs real CPU on every HMR round-trip.

</details>

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

`DELETE /api/listings/{id}`

Removes a listing. `204` on success, `404` if that id never existed. There is
no ownership check - anyone can delete anyone's pin, the same tradeoff the
anonymous `POST` already makes. The UI puts this behind a two-step confirm,
but that is a speed bump, not access control.

## Two Kinds of Pin

A pin is either a **business** (`kind=SERVICE`) or an **experience**
(`kind=EXPERIENCE`). Clicking the map asks which before showing a form.

| | Business | Experience |
| --- | --- | --- |
| Business name | required | **not asked, and rejected if sent** |
| Website | optional | **not asked, and rejected if sent** |
| Categories | 8 trades (Food, Barber, …) | none - "experience" is the category |
| Map pin | category glyph (fork, scissors…) | **text logo** reading "Experience" |
| Image | none - category glyph tile | generated avatar |

`kind` and `category` are **orthogonal columns**, and there is deliberately no
`EXPERIENCE` member in `BusinessCategory`. Hibernate emits a CHECK constraint
listing that enum's values, and `ddl-auto=update` will not widen it on a
database that already has rows - adding a member breaks every existing
checkout with `Value not permitted for column`. An experience stores
`category=OTHER` plus `kind=EXPERIENCE`. For the same reason `businessName` is
stored as `""` rather than `NULL` on experiences: the column was created
`NOT NULL` and `update` will not relax that either.

Rejecting a business name or link on an experience is enforced server-side by
`@ValidPost`, not just hidden in the UI - otherwise a hand-rolled POST could
park an advert in the community feed wearing an experience's clothes.

### Imagery

Nothing in `frontend/src/utils/media.js` is a real photograph of a real
business. There is no photo field and none of the imported OSM records carry
an `image` tag, so **businesses show no imagery at all** - a business renders
as its category glyph on a category-coloured tile. Experiences get generated
DiceBear avatars - illustrations rather than a stranger's face attached to
someone else's words - and fall back to the same glyph if that fetch fails.

> This was category stock photography from loremflickr behind a small `STOCK`
> badge, and the badge was load-bearing: "King of Gyro" is a real restaurant,
> and an unlabelled stock photo of someone else's kitchen misrepresents them.
> Then loremflickr went dark - TCP connect timing out on both `:80` and `:443`
> while every other CDN in the app answered normally - and every business tile
> sat blank waiting on a request that never resolved. A glyph needs no network,
> cannot fail mid-demo, and makes no claim about the premises at all. Bring
> photography back only when there is a real `photoUrl` to show.

## Seeding Real Data

```powershell
node tools/import-osm.mjs --dry-run   # preview
node tools/import-osm.mjs             # import
node tools/import-osm.mjs --purge     # undo (only rows this tool created)
```

Pulls halal-tagged New Jersey businesses from OpenStreetMap via the Overpass
API. Currently yields **29 local businesses** - King of Gyro, The Halal Zone,
Haraz Coffee House, Union Super Store and Halal Meat, Madina Fountain BBQ, and
so on. Safe to re-run: a row already present under the same name within 250 m
is skipped.

**Why OpenStreetMap and not the big halal directories.** OSM is published under
the Open Database Licence, which permits reuse in a product like this one as
long as the source is credited - which is why imported rows carry
"OpenStreetMap contributors" as the owner name and why the map's attribution
line mentions imported listings, not just tiles. The commercial directories do
not permit it:

| Source | Status |
| --- | --- |
| OpenStreetMap | **Usable.** ODbL, attribution required. |
| halalfood.com | Terms of Use §10: *"You may not scrape, copy, or redistribute platform content without written permission."* |
| zabihah.com | ToS prohibits *"automated data collection"*; `robots.txt` sets `Disallow: /api/` for all agents. |
| halalnj.net | Did not respond (no HTTP response at time of writing). |
| UECNJ, ISCJ | No API. Community organisations - **ask them.** Most likely to say yes, and their data is the highest quality of any source here. |

Getting written permission from UECNJ/ISCJ, or a data partnership with
Zabihah, is the correct route to the "hundreds of listings" number. It is a
conversation, not a scraper.

**Two data-quality rules the importer enforces**, both learned from what the
first run produced:

- **`diet:halal=yes` means "halal options available", not "this place is
  halal".** Only `diet:halal=only` means the whole menu is. 55 of 56 rows are
  `yes`, so descriptions say "with halal options" and name the tag. Halal
  status is a religious obligation - overstating it makes someone break their
  diet on our word.
- **National chains are excluded.** The unfiltered import was 26/56 chains -
  13 Wawas, 5 ShopRites, 3 McDonald's (that last one is near-certainly a
  mis-tag). A gas-station convenience store with one halal item is not a
  Muslim-owned or Muslim-serving local business, and thirteen identical Wawa
  cards bury the businesses this app exists to surface.

> `nj_muslim_businesses_api.json` in the repo root is **not** a verified
> dataset. Its `verification_source` fields cite bodies like the "Passaic
> County Muslim Business Network" that do not appear to exist. Don't import it
> or cite it in the demo without checking each row by hand.

## Notable Decisions

- **No login/signup.** Posting is anonymous-by-name (`ownerName` is free
  text). This trades away moderation/spam control for zero auth-flow build
  time - see `PRD.md` for the tradeoff and the moderation follow-ups it
  implies. Now that `DELETE` exists, the same gap means any visitor can remove
  any listing, which raises the priority of the auth follow-up.
- **H2 is the default database, Postgres is opt-in.** H2 is a `runtime`
  dependency, not `test`, specifically so a clean checkout starts with one
  command. When H2 was test-scoped and `application.properties` hardcoded a
  Postgres URL, a machine without Docker could not start the app at all - the
  failure surfaced as `Unable to determine Dialect without JDBC metadata`,
  which reads like a Hibernate misconfiguration rather than "nothing is
  listening on 5432".
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
