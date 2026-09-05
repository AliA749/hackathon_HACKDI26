# Product Requirements Document: Ummah Local NJ

**Status:** Hackathon MVP (HackDI 2026, 24-hour build)
**Team size:** 3 (1 backend, 2 frontend)
**Author:** Generated with the team, backend/architecture pass
**Last updated:** 2026-09-05

---

## 1. Problem & Vision

Muslim-owned and Muslim-serving businesses across New Jersey (barbers,
restaurants, tutors, clothing stores, clinics, etc.) have no shared,
map-based way to be discovered by the local community. Word of mouth doesn't
scale beyond a single neighborhood, and generic map/review apps don't let
these businesses signal what makes them relevant to this community.

**Vision:** a lightweight, map-first directory where any business owner can
drop a pin and describe themselves in under a minute, and any community
member can find what's nearby or search for a specific kind of service -
with zero signup friction on either side.

## 2. Goals

| Goal | Why it matters for a 24h hackathon |
|---|---|
| A user can find businesses near them on a map in <10 seconds | This is the core demo moment - it has to work every time, on stage, on venue WiFi |
| A business owner can post a pin in under 60 seconds, no account | Removes the single biggest drop-off point (signup) for a 1-day build and a 1-day audience |
| Search narrows results by keyword/category | Judges and demo users will ask "can I search for X" - it's expected table stakes, not a stretch goal |
| Data survives a demo (real DB, not memory-only) | H2 in-memory loses everything on restart; a mid-demo crash shouldn't erase the dataset |

### Non-goals (explicitly out of scope for this build)

- User accounts, login, authentication of any kind
- Editing or deleting someone else's (or even your own) listing post-submit
- Content moderation, spam filtering, or abuse prevention beyond basic input validation
- Payments, subscriptions, or "verified business" paid tiers
- Native mobile apps
- Multi-state support (New Jersey only)

## 3. Users & Personas

- **Business owner ("Amina, halal meal-prep business"):** wants to be found
  by nearby Muslim families. Not technical. Needs a form she can fill out
  from her phone in a couple minutes, with no password to remember.
- **Community member ("Yusuf, looking for a barber"):** opens the site,
  either browses the map near where he lives or types "barber" into search,
  taps a pin, gets a name/description/link.
- **Judge / demo audience:** will pan the map, click to add a pin live, and
  try search - the three flows this PRD treats as load-bearing.

## 4. Core User Stories

1. As a visitor, I see a map defaulted to New Jersey with existing business
   pins, so I immediately understand what the app does.
2. As a visitor, I can pan/zoom the map and see pins update to match what's
   in view, so browsing feels like a real map app, not a static list.
3. As a visitor, I can search by keyword or category and see the map/list
   filter accordingly, so I can find a specific kind of business instead of
   scanning pins one by one.
4. As a business owner, I click a location on the map, fill out a short
   form (name, business name, category, description, optional website), and
   submit - and my pin appears immediately, without creating an account.
5. As a visitor, I can click a pin or a directory list item to see the
   business's details and jump the map to it.

## 5. Functional Requirements

### 5.1 Map

- Default view: fit to New Jersey on load.
- Panning/zooming is soft-locked to a New Jersey bounding box + margin
  (`maxBounds`) so the app can't be scrolled out to a blank world map.
- Minimum zoom prevents zooming out past the state view.
- Pins render as colored markers keyed by category; clicking one shows a
  popup with name, category, owner, description, and website link.
- **Reliability requirement:** tiles must render fully during pan/zoom, no
  gray/blank tile regions ("ghosting"). See §8 (Known Risks) for the root
  cause found in this build and its fix.

### 5.2 Business submission ("pin a spot")

- Clicking the map at a point inside the New Jersey bounds opens a
  composer/modal, pre-filled with the clicked coordinates.
- Clicking outside the eligible bounds does nothing (no dead-end error
  modal for an invalid location).
- Required fields: owner name, business name, category (enum), description.
  Optional: website/booking URL.
- On submit: `POST /api/listings`. On success, the new pin appears on the
  map and in the sidebar list immediately (no page reload, no re-fetch
  round-trip needed for the user's own new pin).
- On validation failure, the user sees the specific field-level reason
  (e.g. "latitude must be ≤ 41.40"), not a generic "something went wrong."

### 5.3 Search

- A search bar (keyword) and category filter, combinable.
- Search is scoped to the current map viewport by default (consistent with
  "search businesses/services based on the map" - i.e., what you're looking
  at is what you're searching), matching keyword against business name and
  description, case-insensitive substring match.
- Clearing the search returns to the plain "pins in view" behavior.

### 5.4 No login/signup

- There is no authentication anywhere in this build. "Ownership" of a
  listing is nominal only (a free-text `ownerName` field) - it is not a
  security boundary and nothing should be built as though it were.
- Direct consequence: anyone can post anything, and nobody can edit/delete
  their own post after submission (no identity to check it against). This
  is an accepted tradeoff for the hackathon timeline; see §9 for what a
  post-hackathon version needs before real users touch it.

## 6. Non-Functional Requirements

- **Latency:** pin list fetch and pin creation should feel instant on a
  local/venue network (<500ms perceived) - this is a demo, not a
  production SLA.
- **Data durability:** listings persist in Postgres across backend
  restarts (this is the reason for moving off in-memory H2).
- **Availability of map tiles:** must not depend on a tile host that
  throttles under shared-network conditions (see §8).
- **Accessibility baseline:** forms and buttons are labeled
  (`aria-label`s), status text updates are announced (`aria-live`), the app
  is usable on a phone-width viewport (this is a map app people will pull
  up on their phone at the business itself).
- **No secrets in the frontend.** No API keys are required for the map
  tiles or geolocation in this build; if a future tile/geocoding provider
  needs a key, it must not be committed to the repo.

## 7. System Architecture

```text
┌─────────────────────────┐        HTTP (JSON)        ┌───────────────────────────┐
│  frontend/ (React+Vite)  │ ─────────────────────────▶│  muslim-local-nj (Spring  │
│  - Leaflet map           │◀───────────────────────── │  Boot)                    │
│  - Search bar            │      /api/listings         │  - REST controller        │
│  - Pin composer modal     │                            │  - Bean Validation        │
└─────────────────────────┘                            │  - Spring Data JPA        │
                                                          └─────────────┬─────────────┘
                                                                        │ JDBC
                                                                        ▼
                                                          ┌───────────────────────────┐
                                                          │  Postgres (docker-compose) │
                                                          └───────────────────────────┘
```

- **Frontend:** React 18 + Vite, `react-leaflet` for the map, plain
  `fetch` for API calls. Dev server proxies `/api` to the backend so no
  CORS configuration is needed day-to-day (CORS is still configured
  server-side as a fallback for split deployments).
- **Backend:** Spring Boot (Web MVC, Data JPA, Validation). Single
  `BusinessListing` entity/table for the MVP - no separate "user" table,
  by design (§5.4).
- **Database:** Postgres, run locally via `docker-compose.yml` for the
  hackathon. `ddl-auto=update` is used for schema speed; this is explicitly
  not production-safe (see §9).

## 8. Data Model

**Entity: `BusinessListing`**

| Field | Type | Notes |
|---|---|---|
| `id` | Long | Auto-generated PK |
| `ownerName` | String(80) | Free text, not an account reference |
| `businessName` | String(100) | |
| `category` | Enum | `FOOD, BARBER, CLOTHING, EDUCATION, HEALTH, SERVICES, RETAIL, OTHER` |
| `comment` | String(500) | The business description shown to users |
| `websiteUrl` | String(255) | Optional; must be `http(s)://` if present |
| `latitude` | Double | Bounded to New Jersey (see below) |
| `longitude` | Double | Bounded to New Jersey (see below) |
| `createdAt` | Instant | Set on insert, used to sort newest-first |

**New Jersey bounds (single source of truth, must match exactly on both
sides of the stack):**

- Latitude: `38.78` to `41.40`
- Longitude: `-75.60` to `-73.85`

This box is a deliberate superset of NJ's real extremes (≈38.93-41.36 lat,
≈-75.58 to -73.89 lng) so that anything the frontend allows a user to click
is guaranteed to pass backend validation. Backend: `NjBounds.java`.
Frontend: `frontend/src/constants/bounds.js`.

**The box is not sufficient on its own.** New Jersey is not a rectangle, so
this box also covers Philadelphia, Staten Island, part of Delaware and open
ocean. Authoritative enforcement is a point-in-polygon test against the real
state outline (`geo/new-jersey.geojson`, served at `GET /api/geo/nj-boundary`
and validated by the `@InNewJersey` constraint). The box remains only as a
fast-reject and for map viewport framing.

## 9. API Specification

`GET /api/listings`

Query params (all optional, all combinable):

| Param | Type | Effect |
|---|---|---|
| `minLat`, `maxLat`, `minLng`, `maxLng` | Double | Restrict to a bounding box (map viewport) |
| `category` | Enum | Exact match |
| `q` | String | Case-insensitive substring match on business name / description |

Returns `BusinessListingResponse[]`, newest first.

`POST /api/listings`

Body: `ownerName`, `businessName`, `category`, `comment`, `websiteUrl`
(optional), `latitude`, `longitude`. Returns `201` with the created
listing, or `400` with `{ message, errors: { field: reason } }` on
validation failure.

## 10. Root-Cause Bugs Fixed In This Pass

These were reported as blocking issues going into this pass; both are now
fixed in code, documented here so the team understands *why*, not just
*that*:

1. **"We weren't able to pin a spot and store it."** The frontend allowed
   clicks in a padded area slightly larger than New Jersey, while the
   backend's `@DecimalMin/@DecimalMax` validation used a *different*,
   narrower box. Clicks near the state border (e.g. near Cape May or Sandy
   Hook) passed the frontend's check but failed backend validation with a
   generic 400, which surfaced as "nothing happens." Fix: both sides now
   read from the exact same four numbers (§8), and the backend returns a
   field-level reason on failure instead of a generic error.
2. **Map "ghosting" (blank tiles on pan).** The map pulled tiles from
   `tile.openstreetmap.org` directly - a single host with a strict usage
   policy that throttles/blocks under the kind of concentrated,
   shared-network traffic a hackathon venue produces. Fix: switched to
   CARTO's basemap CDN (no API key required, built for this traffic
   pattern) and increased `keepBuffer` so tiles preload further outside the
   viewport. Also added a `ResizeObserver`-driven `invalidateSize()` call,
   since React re-layouts (sidebar/modal state changes) can leave Leaflet's
   cached container size stale, which independently causes the same
   symptom.

3. **A bounding box let non-NJ businesses in.** Posting at Philadelphia's
   coordinates returned `201 Created`, because a rectangle drawn around New
   Jersey necessarily includes Philadelphia, Staten Island, part of Delaware
   and the Atlantic. Fix: the real state outline is now shipped as GeoJSON,
   enforced server-side by a point-in-polygon constraint, served to the
   frontend at `GET /api/geo/nj-boundary` so both sides share one polygon,
   and drawn on the map so users can see where posting is allowed. Covered by
   `NewJerseyBoundaryTest` (Camden inside, Philadelphia outside - ~5km apart).

## 11. Suggested 24-Hour Timeline

| Hours | Backend | Frontend (x2) |
|---|---|---|
| 0-2 | Confirm data model, bounds, API contract (this doc) | Scaffold Vite app, wire map to backend with placeholder styling |
| 2-8 | Postgres migration, search endpoint, validation/error handling | Composer modal, search bar, marker/list rendering |
| 8-14 | Seed data, polish API responses, deploy/env config | Visual design pass, responsive layout, empty/error states |
| 14-20 | Bug bash against real demo flow, docker-compose validation | Bug bash, mobile pass, accessibility labels |
| 20-24 | Freeze, demo script rehearsal | Freeze, demo script rehearsal |

## 12. Success Metrics (for the demo, not production)

- Live demo: judge can pan the map, search "barber," click a pin, and add a
  new pin, all without an error, in under 2 minutes.
- Seed data covers at least 3 categories across at least 2 distinct NJ
  regions (already true - see `SeedData.java`).
- Zero data loss across a backend restart during the demo (Postgres, not
  H2-in-memory).

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Venue WiFi rate-limits map tiles | Already mitigated: CARTO basemap CDN instead of raw OSM tile host |
| Postgres not running when backend starts | `docker-compose.yml` provided; document `docker compose up -d` as step 1 in the demo runbook |
| No moderation → embarrassing/spam pin during live demo | Accepted risk for the hackathon; mitigate socially (only team posts pins pre-demo) rather than building a moderation system under time pressure |
| Bounds drift between frontend/backend again | Both files now carry an explicit comment pointing at the other; call this out in code review if either changes |

## 14. Post-Hackathon Roadmap (explicitly not in this build)

- Lightweight ownership: a claim link/token emailed or shown once at
  submission time, letting an owner edit/remove *their* listing without a
  full account system.
- Moderation queue / report-listing button.
- Replace `ddl-auto=update` with Flyway migrations.
- Photo uploads, verified-business badge.
- Geocoding a typed address (not just clicking the map) for less
  map-literate business owners.
