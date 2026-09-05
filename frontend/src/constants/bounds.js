import L from "leaflet";

// Keep these four numbers identical to backend NjBounds.java. This is the
// exact box the backend will accept - the map only lets users click inside
// it, so a click is never rejected by the server after the fact.
export const NJ_SOUTH_WEST = [38.78, -75.6];
export const NJ_NORTH_EAST = [41.4, -73.85];
export const NJ_BOUNDS = L.latLngBounds(NJ_SOUTH_WEST, NJ_NORTH_EAST);

// Visual pan/zoom limit is a bit looser than the click-eligible area so the
// state doesn't feel like it's pinned right at the screen edge.
export const NJ_VIEW_BOUNDS = NJ_BOUNDS.pad(0.2);

export const NJ_CENTER = [40.143, -74.731];
export const ONE_MILE_METERS = 1609.34;
