# Project Report — Ummah Local NJ

**Event:** HackDI 2026 (Hack Darul Islah) · **Build window:** 2026-09-05 → 2026-09-06
**Repo:** `AliA749/hackathon_HACKDI26` · **Team:** 3 (1 backend, 2 frontend)

All figures in this report were measured on the running project on 2026-09-06.
Nothing here is estimated.

---

## 1. What we built

A geolocation-based discovery platform for Muslim-owned and Muslim-serving
businesses across New Jersey. Users browse a Leaflet map, filter by trade or
keyword, and drop their own pin with a short listing — no account required.

Two kinds of pin share one map:

| | Business (`kind=SERVICE`) | Experience (`kind=EXPERIENCE`) |
|---|---|---|
| Business name | required | not asked, **rejected if sent** |
| Website | optional | not asked, **rejected if sent** |
| Categories | 8 trades (Food, Barber, …) | none — "experience" is the category |
| Map pin | category glyph | text mark reading "Experience" |
| Image | category stock photo, badged `STOCK` | generated avatar |

---

## 2. Architecture

```
┌────────────────────────────────┐   HTTP/JSON   ┌────────────────────────────────┐
│ frontend/  React 18 + Vite 5    │ ────────────▶ │ muslim-local-nj/  Spring Boot 4 │
│  · react-leaflet map            │ ◀──────────── │  · REST controllers             │
│  · search + trade filters       │  /api/*       │  · Jakarta Bean Validation      │
│  · pin composer modal           │               │  · Spring Data JPA              │
│  · Tailwind styling             │               │  · point-in-polygon NJ check    │
│                          :5173  │               │                          :8080  │
└────────────────────────────────┘               └───────────────┬────────────────┘
        Vite dev-server proxies /api → :8080                     │ JDBC
        (no CORS configuration needed in dev)                    ▼
                                              ┌──────────────────────────────────┐
                                              │ H2 file-backed  (default)         │
                                              │ Postgres via compose (opt-in)     │
                                              └──────────────────────────────────┘
```

### Backend package layout

```
org.hackdi.localnj
├── MuslimLocalNjApplication
├── common/     ApiExceptionHandler (field-level 400s), WebConfig (CORS)
├── geo/        NewJerseyBoundary (ray-casting point-in-polygon), GeoController
└── listing/    BusinessListing entity · BusinessCategory · PostKind
                BusinessListingController · BusinessListingRepository
                BusinessListingRequest / Response
                NjBounds · @InNewJersey + validator
                @ValidPost + validator   (SERVICE/EXPERIENCE shape rules)
                SeedData · PostKindBackfill  (ordered CommandLineRunners)
```

### Frontend module layout

```
frontend/src
├── App.jsx, main.jsx
├── api/          listings.js, geo.js
├── components/   MapView · ListingSidebar · ListingCard · PinComposer
                  SearchBar · Header · markerIcons
├── constants/    bounds.js (mirrors NjBounds.java) · categories.js
├── hooks/        useListings.js  (fetch + optimistic add/remove)
├── utils/        geometry · media (stock imagery) · time
└── styles/       index.css (Tailwind)
```

---

## 3. Tools & technologies

### Runtime stack

| Layer | Choice | Version | Why this one |
|---|---|---|---|
| Language (backend) | Java | 21 (Temurin) | LTS; records for DTOs, text blocks for JPQL |
| Framework | Spring Boot | 4.1.1 | Web MVC + Data JPA + Validation in one starter set |
| Validation | Jakarta Bean Validation | via starter | Lets "is this really in NJ" be a composable constraint |
| Persistence | Spring Data JPA / Hibernate | via starter | One `@Query` covers every filter combination |
| DB (default) | H2, **file-backed** | runtime scope | Zero-prerequisite cold start; survives restarts |
| DB (opt-in) | PostgreSQL | runtime scope | Shared team DB / production-like deploy |
| Language (frontend) | JavaScript (ESM) | — | No TS build step to debug at 3am |
| UI | React | 18.3 | Team familiarity |
| Bundler / dev server | Vite | 5.4 | ~215 ms cold start; `/api` proxy removes CORS from dev |
| Map | Leaflet + react-leaflet | 1.9.4 / 4.2 | Keyless, no vendor lock, full control over markers |
| Tiles | Stadia Maps "OSM Bright" | — | Keyless on localhost; survives shared-network traffic |
| Styling | Tailwind CSS + PostCSS + autoprefixer | 3.4 | Fast iteration on a design language |

### Build, tooling & workflow

| Tool | Used for |
|---|---|
| Maven Wrapper (`mvnw`) | Backend build — no Maven install required on any machine |
| npm | Frontend dependencies |
| JUnit 5 (Jupiter) + Spring Boot test starters | 26 backend tests, incl. `@ParameterizedTest`/`@CsvSource` |
| Node ESM script (`tools/import-osm.mjs`) | OSM Overpass import — dry-run / import / purge |
| PowerShell (`start-dev.ps1`, `stop-dev.ps1`) | One-command launch and clean teardown |
| Docker Compose | Optional local Postgres |
| Git + GitHub (fork → PR) | Two forks, PRs into `AliA749/hackathon_HACKDI26` |
| Claude Code | AI pair-programming across backend, frontend, tooling and docs |

### External data & services

| Service | Role | Licence / terms |
|---|---|---|
| OpenStreetMap (Overpass API) | Real halal business records | ODbL — reuse permitted **with attribution** |
| Stadia Maps / OpenMapTiles | Basemap raster tiles | Keyless on localhost; free key for a public domain |
| `unitedstates/districts` | NJ state outline GeoJSON | Public domain (US Census TIGER derived) |
| loremflickr | Category stock photography | Placeholder only, badged `STOCK` |
| DiceBear | Generated avatars for experiences | Illustration, not a real person's face |

---

## 4. How we built it — timeline

Reconstructed from git history: **16 commits, 2026-09-05 10:37 → 2026-09-06 06:53
(~20 hours).**

| Phase | Commits | What happened |
|---|---|---|
| **Foundation** | `6cee25b`, `9c0deec`, `aefc557` | Repo init, first test programs |
| **Spec + scaffold** | `112996f`, `57c1231` | Candidate dataset added; PRD written; basic frontend |
| **Feature build** | `64b498b` | Backend model, validation, REST API, search; frontend map + composer |
| **Map crisis** | `b608128`, `2f899a5` | Leaflet SRI hash fix; CARTO → Stadia basemap |
| **Design pass** | `2231999` (PR #1) | Restyle to the UmmahMap design language |
| **DX + delete** | `d2e54b2` (PR #2) | One-command launch, working locate button, DELETE endpoint |
| **Real data** | `abc16a9` | OpenStreetMap halal business importer |
| **Two pin types** | `846871a` | Businesses / Experiences split, `@ValidPost`, backfill runner |

Collaboration ran **fork → pull request**, not direct pushes to `main` — two PRs
merged during the build, with the current `fastver` work open as PR #3.

---

## 5. Engineering decisions worth defending

**Point-in-polygon, not a bounding box.** A rectangle around New Jersey also
contains Philadelphia, Staten Island, part of Delaware, and open ocean — our
first version returned `201 Created` for a Philadelphia pin. We now ship the real
state outline as GeoJSON, run ray-casting against it server-side (MultiPolygon
and interior holes handled), keep the box only as a fast-reject, and serve the
*same polygon* to the frontend at `GET /api/geo/nj-boundary` so the two sides
cannot drift apart.

**One query, every filter.** `BusinessListingRepository.search(...)` uses
`(:param IS NULL OR ...)` so bounds, keyword, category, and kind are all optional
and freely combinable. "Search this area" needed no new endpoint.

**`kind` and `category` are orthogonal columns.** `BusinessCategory` deliberately
has no `EXPERIENCE` member: Hibernate emits a CHECK constraint from the enum's
values and `ddl-auto=update` will not widen it on a database that already holds
rows — adding a member breaks every existing checkout with `Value not permitted
for column`. There is a unit test asserting the member never appears.

**Migration as an ordered `CommandLineRunner`.** `PostKindBackfill` (`@Order(1)`,
before `SeedData`) stamps `kind=SERVICE` on rows that predate the column. Without
it, `l.kind = :kind` would silently omit them — NULL never equals anything in
SQL — and the entire imported directory would vanish the first time someone
clicked "Businesses."

**Server-side shape rules, not UI-only.** `@ValidPost` rejects a business name or
website on an experience. The composer never asks for them, but a hand-rolled
POST could otherwise park an advertisement in the community feed.

**H2 as a `runtime` dependency.** Not test-scoped — that's what previously made a
cold start fail on a machine without Docker, surfacing as `Unable to determine
Dialect without JDBC metadata`.

**Optimistic delete with rollback.** The card disappears on click and returns if
the server rejects it. Waiting for the round-trip leaves the card sitting there
looking like the button did nothing. `DELETE` returns 204 vs 404 distinctly, so a
double-click on a stale id doesn't report false success.

**Startup time treated as a feature.** Prebuilt jar with staleness checking
(`src/main` only — `src/test` can't change a `-DskipTests` jar), Spring Boot
`jarmode=tools extract` layout (6.6 s vs 7.7 s, 5 runs each), and
`-XX:TieredStopAtLevel=1`. CDS was measured and **rejected**: 0.65 s faster, but a
21 s training run per rebuild and a 93 MB archive that silently invalidates.

---

## 6. Bugs found and root-caused

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | "We can't pin a spot" — nothing happens | Frontend click area was a *different, wider* box than backend validation; border clicks 400'd generically | Both sides read the same four numbers; field-level error responses |
| 2 | Philadelphia pin accepted (`201`) | A box around NJ contains Philadelphia | Real point-in-polygon check against shipped GeoJSON |
| 3 | Blank grey tiles when panning | `tile.openstreetmap.org` throttles shared-network traffic | Stadia "OSM Bright", `keepBuffer={6}` |
| 4 | Blank grey tiles (again) | Leaflet caches container size; sidebar/modal re-layout leaves it stale | `ResizeObserver` → `invalidateSize()`, double-guarded against feedback loop |
| 5 | Watermarked map | CARTO now stamps "API KEY REQUIRED" on free raster tiles | Moved off CARTO |
| 6 | Scattered tiles, dead zoom controls | Wrong SRI hash → browser **silently** discarded `leaflet.css` | Corrected 1.9.4 integrity hash |
| 7 | Zoom button opened the composer | Map overlay clicks propagated to the map's own listener | `L.DomEvent.disableClickPropagation` |
| 8 | Imported directory would vanish under a filter | `kind` NULL on pre-existing rows | `PostKindBackfill` runner |

---

## 7. Data pipeline

`tools/import-osm.mjs` — 321 lines, three modes: `--dry-run`, default import,
`--purge` (removes only rows this tool created). Idempotent: a row already present
under the same name within 250 m is skipped.

**Verified run, 2026-09-06:**

```
Querying OpenStreetMap... 56 elements
56 usable records (named + geocoded)
27 national-chain rows excluded (Dunkin', ShopRite, Trader Joe's, Wawa,
                                 McDonald's, Taco Bell, Wendy's)
29 new to import   {"FOOD": 28, "OTHER": 1}
```

Two data-quality rules are enforced in the importer, both learned from what the
first run actually produced:

1. **`diet:halal=yes` means "halal options available," not "this place is halal."**
   Only `=only` means the whole menu is. 55 of 56 rows are `yes`, so generated
   descriptions say "with halal options" and name the source tag rather than
   asserting certification. Halal status is a religious obligation — overstating
   it makes someone break their diet on our word.
2. **National chains are excluded.** A gas-station convenience store with one
   halal item is not a Muslim-owned or Muslim-serving local business, and a screen
   of identical Wawa cards buries the businesses this app exists to surface.

**Sources we investigated and rejected on licensing grounds:** halalfood.com (ToU
§10 forbids scraping), zabihah.com (ToS prohibits automated collection;
`robots.txt` disallows `/api/`), halalnj.net (no response). The route to hundreds
of listings is a data partnership with UECNJ/ISCJ — a conversation, not a scraper.

`nj_muslim_businesses_api.json` in the repo root is **not** a verified dataset and
was never imported: its `verification_source` fields cite bodies that do not
appear to exist. It's kept with that warning attached in the README.

---

## 8. Testing

**26 tests · 0 failures · 9.7 s** (`mvnw test`, verified 2026-09-06).

| Suite | Tests | Covers |
|---|---|---|
| `NewJerseyBoundaryTest` | 16 | 8 NJ cities inside; Philadelphia, Staten Island, Manhattan, Bronx, Wilmington DE, Atlantic Ocean outside; far-field rejects |
| `PostKindValidationTest` | 7 | SERVICE/EXPERIENCE shape rules; absent `kind` defaults to SERVICE for older clients; `BusinessCategory` never grows an `EXPERIENCE` member |
| `BusinessListingDeleteTest` | 3 | 204 on success, 404 on unknown id, unrelated rows untouched |
| `MuslimLocalNjApplicationTests` | 1 | Context loads |

Camden-in / Philadelphia-out is the sharpest case — about 5 km apart across the
Delaware River.

**Gap:** no frontend automated tests. Manually validated against the demo flow.

---

## 9. Developer experience

`start-dev.ps1` (169 lines) is a deliberate piece of engineering, not a
convenience wrapper:

- Fails early with an actionable message if `java` or `npm` is missing, rather
  than a stack trace 40 seconds in.
- Rebuilds the backend jar only when a file under `src/main` or `pom.xml` is
  newer than it; builds offline (`-o`) to skip repo metadata latency.
- Installs frontend deps only if `node_modules` is absent.
- Launches both servers hidden with logs to `.dev-logs/`, polls both until they
  answer, prints elapsed time and PIDs.
- Flags: `-Db ./data/yours` (per-teammate scratch database), `-Rebuild`, `-NoBrowser`.

`stop-dev.ps1` matches on **what is actually listening** on :8080 and :5173 and
kills those process trees — not every `java.exe` and `node.exe` on the machine,
which would take out unrelated work.

**Measured:** 4.9 s to both servers answering with the jar current.

---

## 10. Project metrics

| Metric | Value |
|---|---|
| Backend Java (main) | 849 lines · 19 files |
| Backend Java (test) | 217 lines · 4 files |
| Frontend JS/JSX/CSS | 2,113 lines · 18 files |
| Tooling (Node + PowerShell) | 522 lines · 3 files |
| **Total hand-written** | **~3,700 lines** (excludes GeoJSON, lockfiles, deps) |
| Commits | 16 |
| Pull requests | 3 (2 merged during the build) |
| API endpoints | 4 |
| Tests | 26 passing |
| Build window | ~20 hours |

---

## 11. Known limitations

Stated plainly, because judges will find them anyway:

- **No authentication anywhere.** `ownerName` is free text, not an identity.
- **`DELETE` has no ownership check** — anyone can remove anyone's listing. The
  two-step UI confirm is a speed bump, not access control.
- **No moderation or spam control** beyond input validation.
- **`ddl-auto=update`** — not production-safe; needs Flyway or Liquibase.
- **No frontend tests.**
- **New Jersey only**, by design.
- **Stock imagery**, badged `STOCK`; no real business photos exist in the data.
- **Search is `LIKE '%…%'` over two columns** with no pagination — fine at
  hundreds of rows, not at tens of thousands.

## 12. Roadmap

1. **Claim tokens** — a link issued at submission lets an owner edit or remove
   *their* listing without a full account system. Closes the delete hole.
2. **Report button + moderation queue.**
3. **Flyway migrations** replacing `ddl-auto=update`.
4. **Data partnership** with UECNJ / ISCJ for verified listings at real volume.
5. **Photo uploads** and a verified/claimed badge — which retires the entire
   `utils/media.js` stock-photo module.
6. **Address geocoding**, so a less map-literate owner can type an address
   instead of clicking a point.
7. **PostGIS + full-text search** when listing count justifies it.

---

## Appendix — running it

```powershell
.\start-dev.ps1                     # build if needed, start both, open browser
.\start-dev.ps1 -Db ./data/yours    # your own scratch database
.\start-dev.ps1 -Rebuild            # force a clean backend rebuild
.\stop-dev.ps1                      # stop what's listening on :8080 and :5173

node tools/import-osm.mjs --dry-run # preview the OSM import
node tools/import-osm.mjs           # import 29 real halal businesses
node tools/import-osm.mjs --purge   # undo (only rows this tool created)

cd muslim-local-nj; .\mvnw.cmd test # 26 tests
```

Requirements: **Java 21+ and Node 18+**. No Docker, no Postgres, no environment
variables.
