# Ummah Local NJ

A Spring Boot hackathon prototype for a Muslim-focused New Jersey business map.
Users can open the locally hosted website, browse a movable map, share their
approximate one-mile area, click a location, and post a community business note
with a website or booking link.

## Local Run

```powershell
cd muslim-local-nj
.\mvnw.cmd spring-boot:run
```

Then open `http://localhost:8080`.

## Demo Flow

1. Open the app and browse the New Jersey map.
2. Click `Use my location` to draw an approximate one-mile circle around the
   browser location.
3. Click the map where a business is located.
4. Fill out the business form and publish the pin.
5. Select pins or directory cards to view posts from other local users.

## Architecture

```text
Browser frontend
  Static HTML/CSS/JS served by Spring Boot
  Leaflet + OpenStreetMap tiles for map movement and pins
  Browser Geolocation API for approximate one-mile radius

Spring Boot backend
  /api/listings REST controller
  Jakarta validation for form inputs and New Jersey coordinate bounds
  Spring Data JPA repository

H2 database
  File-backed local database at muslim-local-nj/data/
  Seed records for first-run demo content
```

## API

`GET /api/listings`

Returns all listings, newest first. Optional query params:
`minLat`, `maxLat`, `minLng`, `maxLng`.

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

## Team Split

- Backend member: listing model, validation, REST API, persistence.
- Frontend member: map UX, geolocation, posting drawer, responsive layout.
- Architecture/demo member: README, presentation flow, acceptance testing, future
  roadmap.

## Future Enhancements

- User accounts and moderation queue.
- Business search by category, masjid area, city, or halal certification.
- Photo uploads and verified owner profiles.
- Production database such as PostgreSQL.
