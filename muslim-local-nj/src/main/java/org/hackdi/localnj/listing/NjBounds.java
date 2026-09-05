package org.hackdi.localnj.listing;

/**
 * Single source of truth for the New Jersey bounding box used to validate pin
 * coordinates.
 *
 * <p>This box is intentionally a superset of the real state outline (real
 * extremes are roughly lat 38.928-41.357, lng -75.585 to -73.887) so that any
 * point the frontend lets a user click is guaranteed to pass backend
 * validation. The frontend's {@code NJ_BOUNDS} constant (see
 * {@code frontend/src/constants/bounds.js}) MUST use these exact same four
 * numbers - a previous bug came from the two bounds drifting apart, which
 * silently rejected clicks near the state border with a 400 error.</p>
 */
public final class NjBounds {

	private NjBounds() {
	}

	public static final String MIN_LAT = "38.78";
	public static final String MAX_LAT = "41.40";
	public static final String MIN_LNG = "-75.60";
	public static final String MAX_LNG = "-73.85";
}
