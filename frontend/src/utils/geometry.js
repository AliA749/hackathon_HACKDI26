/**
 * Ray-casting point-in-polygon over a GeoJSON Polygon or MultiPolygon.
 * Mirrors NewJerseyBoundary.java on the backend - keep the two in step.
 */
export function containsPoint(geometry, lat, lng) {
	if (!geometry) {
		return false;
	}

	const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

	return polygons.some((polygon) => {
		const [outerRing, ...holes] = polygon;
		if (!inRing(lat, lng, outerRing)) {
			return false;
		}
		return !holes.some((hole) => inRing(lat, lng, hole));
	});
}

// GeoJSON ring points are [longitude, latitude].
function inRing(lat, lng, ring) {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		if (((yi > lat) !== (yj > lat)) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}
