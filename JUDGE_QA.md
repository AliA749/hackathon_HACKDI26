# Judge Q&A — Ummah Local NJ

Prep sheet for HackDI 2026 judging. Every number here was verified against the
running app on 2026-09-06, not estimated. If a judge asks something not on this
sheet, the honest answer beats the impressive one — see §10.

---

## The 30-second pitch

> Muslim-owned and Muslim-serving businesses in New Jersey — barbers,
> restaurants, tutors, clinics — are found by word of mouth, which doesn't scale
> past one neighbourhood. Ummah Local NJ is a map-first directory where a
> business owner drops a pin and describes themselves in under a minute with no
> account, and a community member finds what's nearby in under ten seconds.
> It's live, backed by a real database, and seeded with 29 real halal businesses
> pulled from OpenStreetMap under a licence that actually permits it.

## The 2-minute demo script

1. **Open** `http://localhost:5173` — map fits New Jersey, boundary drawn, pins load.
2. **Search** "halal" or click the **Food** trade filter — map and sidebar filter together.
3. **Toggle Businesses / Experiences** — the two pin types are visually distinct.
4. **Click inside New Jersey** — composer opens, pre-filled with the clicked coordinates.
5. **Submit** — pin appears instantly, no reload.
6. **Try clicking in Philadelphia** — nothing happens. Explain why (§2). This is
   the moment that separates this from a rectangle-around-NJ demo.

**Before you demo:** run `node tools/import-osm.mjs` once so the map shows 29 real
businesses instead of the 3 seed rows. Then `.\start-dev.ps1`.

---

## 1. Product & problem

**Q: Why not just use Google Maps?**
Google answers "where is a restaurant." It does not answer "which of these is run
by, or actively serves, my community" — there is no field for that, and no way
for an owner to signal it. We also let an owner publish in under 60 seconds with
no account, no verification queue, and no listing fee. Google's business-claim
flow is a multi-day postcard verification.

**Q: Who is this for, specifically?**
Three personas, written into the PRD before we built:
- **Amina**, halal meal-prep owner — non-technical, wants to be found, will not
  remember another password.
- **Yusuf**, looking for a barber — opens the site, searches, taps a pin, done.
- **The judge** — pans, searches, adds a live pin. We treated those three flows
  as load-bearing and everything else as optional.

**Q: Why New Jersey only?**
Scope discipline for a 24-hour build, and NJ has one of the densest Muslim
populations in the US. It is also enforced in code rather than assumed — the
state outline is a real GeoJSON polygon (§2), so "expand to New York" is a data
change plus a constant, not a rewrite.

**Q: What's an "experience" pin? Why two types?**
A **business** (`kind=SERVICE`) has a name, a trade, and a website. An
**experience** (`kind=EXPERIENCE`) is somebody describing what a place is like —
"parking is easy on Fridays and the area feels welcoming." Not every useful thing
about a location is a business. Experiences render with a text "Experience" mark
instead of a trade glyph, and the server **rejects** a business name or a link on
one, so nobody can park an advert in the community feed wearing an experience's
clothes. That's enforced by `@ValidPost` server-side, not just hidden in the UI.

---

## 2. Technical architecture

**Q: Walk me through the stack.**

```
React 18 + Vite 5 + react-leaflet                    :5173
        │  fetch("/api/...")   (Vite proxies /api → :8080, so no CORS in dev)
        ▼
Spring Boot 4.1.1 (Web MVC, Data JPA, Validation), Java 21     :8080
        │  JDBC
        ▼
H2, file-backed (default)  ·  Postgres via docker-compose (opt-in profile)
```

**Q: Why Spring Boot and not something lighter?**
Bean Validation is the reason. Our hardest correctness requirement is "this
coordinate is really in New Jersey," and Jakarta Validation lets that be a custom
constraint (`@InNewJersey`) that composes with the field-level ones and reports
into the same error map the frontend already renders. We'd have hand-rolled that
in Express.

**Q: Why H2 by default instead of Postgres?**
Because a clean checkout has to start with one command on a teammate's laptop
with no Docker daemon. H2 is a **`runtime`** dependency, not `test` — deliberate.
When it was test-scoped and `application.properties` hardcoded a Postgres URL, a
machine without Docker couldn't start the app at all, and the error was `Unable
to determine Dialect without JDBC metadata`, which reads like a Hibernate
misconfiguration rather than "nothing is listening on 5432." It is **file-backed,
not in-memory**, so pins posted during a demo survive a restart. Postgres is one
profile flag away for a real deploy.

**Q: How does search work?**
One JPA query backs both "pins in the current viewport" and "search." Every
filter is optional and composable — bounds, keyword, category, kind — via
`(:param IS NULL OR ...)`. Pass nulls for whatever you didn't supply. That's why
"search this area" works without a second endpoint or a tree of query methods.

**Q: How do you stop someone posting a business in Philadelphia?**
*This is our best technical answer — lead with it.*

A bounding box around New Jersey also contains Philadelphia, Staten Island, part
of Delaware, and a lot of the Atlantic. Our first version returned `201 Created`
for a Philadelphia pin. So:

- We ship the real NJ state outline as GeoJSON (public domain, US Census TIGER
  via `unitedstates/districts`).
- The server runs a **ray-casting point-in-polygon test** against it, handling
  MultiPolygon and interior holes, with the bounding box kept only as a cheap
  fast-reject.
- The **same polygon** is served to the frontend at `GET /api/geo/nj-boundary`,
  so the map draws it, tests clicks against it, and physically cannot drift apart
  from server validation.
- `NewJerseyBoundaryTest` asserts Camden is in and Philadelphia is out — about
  5 km apart across the river.

**Q: What happens on a validation failure?**
`400` with a field-level `errors` map (`{"latitude": "..."}`) produced by a
`@RestControllerAdvice`, not Spring's default error page. The user sees "latitude
must be ≤ 41.40," not "something went wrong."

**Q: You changed the schema mid-build. How did you not break everyone's database?**
`kind` was added after teammates already had rows. Three things:

- `PostKindBackfill` is a `CommandLineRunner` ordered **before** `SeedData` that
  stamps `kind=SERVICE` onto pre-existing rows. Without it, `l.kind = :kind`
  would silently omit them — NULL never equals anything in SQL — and the whole
  imported directory would vanish the first time anyone clicked "Businesses."
- We deliberately did **not** add `EXPERIENCE` to the `BusinessCategory` enum.
  Hibernate emits a CHECK constraint from the enum's values, and `ddl-auto=update`
  will not widen it on a database that already holds rows. An experience stores
  `category=OTHER` + `kind=EXPERIENCE`; the two are orthogonal columns. There's a
  unit test asserting the enum never grows that member.
- `businessName` is stored as `""`, not `NULL`, on experiences — for the same
  reason: the column was created `NOT NULL` and `update` won't relax it either.

---

## 3. Data, sourcing & ethics

*This is the strongest part of the project. Do not rush it.*

**Q: Where does the real business data come from?**
OpenStreetMap, via the Overpass API, filtered to New Jersey places tagged
`diet:halal`. Verified today: **56 raw elements → 27 national-chain rows excluded
→ 29 importable local businesses.** Re-running is safe; a row already present
under the same name within 250 m is skipped.

**Q: Why OSM and not one of the big halal directories?**
Licensing, and we checked each one:

| Source | Status |
|---|---|
| **OpenStreetMap** | **Usable.** Open Database Licence — reuse permitted with attribution. |
| halalfood.com | Terms of Use §10 forbids scraping, copying, or redistributing without written permission. |
| zabihah.com | ToS prohibits automated data collection; `robots.txt` sets `Disallow: /api/` for all agents. |
| halalnj.net | No HTTP response at time of writing. |
| UECNJ, ISCJ | No API. Community organisations — **the right answer is to ask them.** |

Because it's ODbL, imported rows carry "OpenStreetMap contributors" as the owner
name rather than an invented person, and the map's attribution line credits
imported listings, not just tiles.

**Q: So how do you get to hundreds of listings?**
A data partnership with UECNJ/ISCJ, or Zabihah. Their data is the highest quality
of any source here and they're the most likely to say yes. That's a conversation,
not a scraper. We'd rather demo 29 lawful rows than 500 stolen ones.

**Q: How do you know these places are actually halal?**
We're careful about this on purpose. OSM's `diet:halal=yes` means *"halal options
available,"* not *"this establishment is halal."* Only `diet:halal=only` means the
whole menu is. **55 of 56 rows are `yes`** — so our descriptions say "with halal
options" and name the source tag explicitly rather than asserting certification.
Halal status is a religious obligation, not a cuisine label; overstating it makes
someone break their diet on our word.

We also declined to widen the query to "Middle Eastern / Turkish / Pakistani
cuisine." It would roughly double the row count and look more impressive, and it
would be inventing halal claims about real restaurants.

**Q: Why exclude chains?**
The unfiltered import was **27 of 56 rows** national chains — Wawa, ShopRite,
McDonald's, Dunkin', Trader Joe's, Taco Bell, Wendy's. A gas-station convenience
store with one halal item is not a Muslim-owned or Muslim-serving local business,
and a screen of identical Wawa cards buries the businesses this app exists to
surface. (The McDonald's tag is near-certainly a mis-tag.)

**Q: Why don't the businesses have photos?**
**Because we don't have any, and we won't fake one.** There is no photo field in
the data and no imported OSM record carries an `image` tag. A business renders as
its category glyph on a coloured tile; experiences get generated avatars rather
than a stranger's face attached to someone else's words.

We did ship category stock photography for a while, behind a **`STOCK`** badge
that said so — "King of Gyro" is a real restaurant, and an unlabelled photo of
someone else's kitchen misrepresents them. Then the image host went dark
mid-build and every business tile sat blank waiting on a TCP timeout. We replaced
it with the glyph rather than re-point at another stock service: the glyph needs
no network, can't fail during a demo, and makes no claim about the premises at
all. Photography comes back when there's a real `photoUrl`.

**Q: There's a `nj_muslim_businesses_api.json` in your repo. What is it?**
An early dataset we **rejected and did not import.** Its `verification_source`
fields cite bodies like the "Passaic County Muslim Business Network" that do not
appear to exist. It's flagged in the README as unverified. We left it in the repo
with the warning attached rather than quietly deleting it.

---

## 4. Security, privacy & trust

**Q: Anyone can post anything. Isn't that a problem?**
Yes, and we say so rather than pretending otherwise. There is **no authentication
anywhere** in this build. `ownerName` is free text and is explicitly not a
security boundary. That bought us the single biggest drop-off point in the
product — signup — for zero build time, which is the right trade for a 24-hour
demo and the wrong trade for real users.

**Q: And DELETE has no ownership check?**
Correct — anyone can delete anyone's pin. It's the same trade the anonymous POST
already makes, but it raises the priority of auth considerably, and we've written
that down. The UI puts deletion behind a two-step confirm, which is a speed bump,
not access control. We're not going to describe it as security.

**Q: What would you do before real users touch this?**
In order: (1) a claim token issued at submission so an owner can edit or remove
*their* listing without a full account system; (2) a report button and moderation
queue; (3) Flyway migrations instead of `ddl-auto=update`; (4) rate limiting on POST.

**Q: Any secrets or API keys in the repo?**
None. Map tiles and geolocation need no key in this build. Stadia Maps is keyless
on `localhost`; a public deployment needs a free key, and it must not be committed.

**Q: What user data do you collect?**
A name the user types, a description, and a coordinate they clicked. No accounts,
no email, no tracking, no analytics. Browser geolocation is used only to centre
the map locally and is never sent to our server.

---

## 5. Scale & performance

**Q: How fast is it?**
Measured, not guessed: **4.9 s** from `.\start-dev.ps1` to both servers answering
when the jar is current; ~10 s when it has to rebuild. Vite is ready in ~215 ms;
the rest is Spring Boot's own startup.

**Q: How did you get startup that low?**
Three specific things, each measured:
- Run a **prebuilt jar** rather than `mvnw spring-boot:run`, which pays Maven's
  full resolve/compile lifecycle on every launch. The jar auto-rebuilds only when
  a file under `src/main` is newer than it — `src/test` deliberately excluded,
  since the jar is packaged `-DskipTests` and a test edit can't change it.
- **`jarmode=tools extract`** layout — dependencies as real jars on a flat
  classpath instead of nested inside the fat jar. 6.6 s vs 7.7 s to first
  response, consistent over 5 runs each.
- **`-XX:TieredStopAtLevel=1`** — slower peak throughput, faster startup. The
  right trade for a process restarted all day.

We also **measured and rejected** CDS (`-XX:ArchiveClassesAtExit`): it saved a
further 0.65 s but cost a 21 s training run on every rebuild and a 93 MB archive
that silently invalidates when the classpath or JDK changes.

**Q: What breaks at 10,000 listings?**
The viewport query is a full table scan with `LIKE '%...%'` on two columns. Fine
at hundreds. At scale you'd want a spatial index (PostGIS `GEOGRAPHY` + GiST) and
full-text search instead of substring matching, plus pagination — right now the
endpoint returns every match. Switching to the Postgres profile is the
prerequisite, and it's already wired.

---

## 6. Bugs we found and fixed

Each was a real failure with a non-obvious cause. Judges reward root causes.

1. **"We couldn't pin a spot."** The frontend allowed clicks in a padded area
   slightly larger than the backend's validation box. Clicks near Cape May or
   Sandy Hook passed the frontend and failed the backend with a generic 400,
   which surfaced as *nothing happening*. Fix: both sides read the same four
   numbers, and failures now return a field-level reason.

2. **A bounding box let Philadelphia in.** Fixed with real point-in-polygon
   validation — see §2.

3. **Map "ghosting" — blank grey tiles on pan.** Two independent causes:
   - `tile.openstreetmap.org` throttles under concentrated shared-network
     traffic, exactly what a hackathon venue produces. We moved to Stadia's "OSM
     Bright" and raised `keepBuffer` to 6. **CARTO is not a substitute** — it now
     stamps "API KEY REQUIRED" across every image, which we found the hard way.
   - Leaflet caches its container size at init. When a sidebar or modal changes
     the layout, panning reveals tiles sized for the *old* container. Fixed with
     a `ResizeObserver` driving `invalidateSize()` — double-guarded, because
     `invalidateSize()` can itself change layout and re-trigger the observer, and
     an unguarded version spawns tiles without bound.

4. **Leaflet rendered as scattered tiles with dead zoom controls.** The CDN
   `leaflet.css` had a wrong SRI integrity hash, so the browser *silently*
   discarded the stylesheet. It looks exactly like a tile-server problem and isn't.

5. **Clicking a zoom button opened the composer underneath it.** Map overlay
   controls needed `L.DomEvent.disableClickPropagation`.

---

## 7. Testing & quality

**Q: Did you write tests? In a hackathon?**
Yes — **26 tests, 0 failures, 9.7 s**, verified today. Not everything, but the
three places where a silent regression would hurt most:
- `NewJerseyBoundaryTest` — 8 NJ cities in, 6 non-NJ locations out, plus
  far-field coordinates. Parameterized, so adding a case is one CSV line.
- `PostKindValidationTest` — 7 tests locking the SERVICE/EXPERIENCE shape rules,
  including that an absent `kind` defaults to `SERVICE` so older clients keep
  working, and that `BusinessCategory` never grows an `EXPERIENCE` member.
- `BusinessListingDeleteTest` — 3 tests. It's the only destructive endpoint and
  it's unauthenticated; a regression turning a 404 into a 204, or deleting the
  wrong row, would be silent.

**Q: What's untested?**
The frontend has no automated tests — no Vitest, no Playwright. That's the honest
gap. It was manually tested against the demo flow.

---

## 8. Team & process

**Q: How did you split the work?**
Backend: data model, validation, REST API, persistence, search. Frontend (×2):
map UX, search and filter UI, posting composer, responsive layout, visual design.
Git shows **16 commits over roughly 20 hours**, 2026-09-05 10:37 → 2026-09-06
06:53, with pull-request merges between forks rather than direct pushes to main.

**Q: Did you use AI to build this?**
Yes — Claude Code, and it's visible in the repo (`.claude/`, `.agents/skills/`,
`skills-lock.json`). We'd rather say so than have someone find it. What it did
*not* do is make the judgement calls: excluding chains, refusing to widen the
halal query, rejecting the fabricated dataset, choosing OSM over Zabihah on
licence grounds, and dropping business photography rather than dressing real
businesses in stock imagery were all decisions we made and can defend. The measurements (6.6 s vs 7.7 s, the CDS rejection) are
real runs, not claims.

**Q: What would you do differently?**
Agree the bounds contract between frontend and backend *before* writing either
side. That mismatch cost us more time than anything else, and it presented as
"nothing happens" — the worst possible symptom to debug under time pressure.

---

## 9. Business & sustainability

**Q: How would this make money?**
It shouldn't, early. The value is density of listings, and charging either side
kills density. Later: sponsored placement for local businesses, or a paid
"verified/claimed" badge — but verification has to mean something, which loops
back to a partnership with UECNJ/ISCJ rather than a payment processor.

**Q: What does it cost to run?**
Near zero at this size. One small JVM, one Postgres, keyless map tiles below
Stadia's free threshold. The expensive part is moderation, and that's human.

**Q: Why would businesses come?**
They don't have to do anything — the community can pin a business it already
knows about, and the owner claims it later. That's the seeding strategy, and it's
why we built anonymous posting rather than owner signup first.

---

## 10. Hard questions — and honest answers

**"This is just a map with a form."**
The map and the form took a day. The part that took judgement was deciding what
we're *allowed* to put on it: which sources permit reuse, what `diet:halal=yes`
actually means, whether a stock photo of someone else's kitchen belongs next to a
real restaurant's name (we decided it doesn't). Those decisions are in the code and
the README, not just in this pitch.

**"Your demo only has 29 businesses."**
29 *lawfully sourced* businesses. We could have had 500 by scraping Zabihah, whose
ToS forbids it, or 56 by keeping the Wawas and the mis-tagged McDonald's. We know
exactly how to get to hundreds and it runs through a phone call to UECNJ.

**"What's actually novel here?"**
Honestly: not the map. The novel parts are the correctness bar — real
point-in-polygon state validation from a single shared polygon — and a data
pipeline that treats a religious dietary claim as something you can get *wrong*
rather than a filter chip.

**"Would you deploy this tomorrow?"**
No. It needs auth and a moderation queue first, because anyone can delete anyone's
listing. That's written into the PRD as a known gap, not discovered just now.

### Things NOT to claim

- Don't say the businesses are "verified" or "certified halal." They're
  OSM-tagged, and mostly `diet:halal=yes` = *has halal options*.
- Don't promise business photos. There are none — tiles are category glyphs.
- Don't cite `nj_muslim_businesses_api.json` as a data source.
- Don't call the two-step delete confirm a security control.
- Don't quote a startup number you haven't just measured on the demo machine.

---

## Cheat sheet

| | |
|---|---|
| Startup (jar current) | **4.9 s** to both servers answering |
| Backend tests | **26 passing, 0 failures, 9.7 s** |
| Backend code | 849 lines of Java, 19 files |
| Frontend code | 2,113 lines of JS/JSX/CSS, 18 files |
| API endpoints | 4 (`GET`/`POST`/`DELETE /api/listings`, `GET /api/geo/nj-boundary`) |
| OSM import | 56 raw → 27 chains excluded → **29 importable** |
| Halal tag reality | 55 of 56 are `diet:halal=yes` = *options available* |
| NJ bounds | lat 38.78–41.40, lng −75.60 to −73.85 (box) **plus point-in-polygon** |
| Categories | 8 trades + orthogonal `kind` (SERVICE / EXPERIENCE) |
| Commits | 16, over ~20 hours |
| Prerequisites | Java 21+, Node 18+. No Docker, no Postgres, no env vars. |
