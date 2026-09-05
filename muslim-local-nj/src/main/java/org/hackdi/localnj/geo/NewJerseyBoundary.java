package org.hackdi.localnj.geo;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Point-in-polygon test against the real New Jersey state outline.
 *
 * <p>A bounding box around New Jersey also contains Philadelphia, Staten
 * Island, part of Delaware and a lot of the Atlantic, so the box alone is not
 * enough to enforce "New Jersey only" - it accepted a Philadelphia pin. The
 * box is still used here as a cheap fast-reject before the real test.</p>
 *
 * <p>Boundary data: unitedstates/districts (public domain, derived from US
 * Census TIGER). Served to the frontend via /api/geo/nj-boundary so both sides
 * test against the exact same polygon and cannot drift apart.</p>
 */
@Component
public class NewJerseyBoundary {

	public static final String RESOURCE_PATH = "geo/new-jersey.geojson";

	/** Per polygon: element 0 is the outer ring, any later elements are holes. */
	private final List<List<double[][]>> polygons = new ArrayList<>();

	private double minLat = Double.POSITIVE_INFINITY;
	private double maxLat = Double.NEGATIVE_INFINITY;
	private double minLng = Double.POSITIVE_INFINITY;
	private double maxLng = Double.NEGATIVE_INFINITY;

	public NewJerseyBoundary(ObjectMapper objectMapper) {
		try (InputStream stream = new ClassPathResource(RESOURCE_PATH).getInputStream()) {
			JsonNode geometry = objectMapper.readTree(stream);
			String type = geometry.path("type").asString();
			JsonNode coordinates = geometry.path("coordinates");

			if ("Polygon".equals(type)) {
				polygons.add(readPolygon(coordinates));
			}
			else if ("MultiPolygon".equals(type)) {
				for (JsonNode polygon : coordinates) {
					polygons.add(readPolygon(polygon));
				}
			}
			else {
				throw new IllegalStateException("Unsupported GeoJSON geometry type: " + type);
			}
		}
		catch (Exception exception) {
			throw new IllegalStateException("Could not load " + RESOURCE_PATH, exception);
		}

		if (polygons.isEmpty()) {
			throw new IllegalStateException("No polygons found in " + RESOURCE_PATH);
		}
	}

	private List<double[][]> readPolygon(JsonNode rings) {
		List<double[][]> polygon = new ArrayList<>();
		for (JsonNode ring : rings) {
			double[][] points = new double[ring.size()][2];
			for (int i = 0; i < ring.size(); i++) {
				// GeoJSON stores coordinates as [longitude, latitude]
				double lng = ring.get(i).get(0).asDouble();
				double lat = ring.get(i).get(1).asDouble();
				points[i][0] = lng;
				points[i][1] = lat;
				minLat = Math.min(minLat, lat);
				maxLat = Math.max(maxLat, lat);
				minLng = Math.min(minLng, lng);
				maxLng = Math.max(maxLng, lng);
			}
			polygon.add(points);
		}
		return polygon;
	}

	public boolean contains(double latitude, double longitude) {
		if (latitude < minLat || latitude > maxLat || longitude < minLng || longitude > maxLng) {
			return false;
		}

		for (List<double[][]> polygon : polygons) {
			if (!inRing(latitude, longitude, polygon.get(0))) {
				continue;
			}
			boolean inHole = false;
			for (int i = 1; i < polygon.size(); i++) {
				if (inRing(latitude, longitude, polygon.get(i))) {
					inHole = true;
					break;
				}
			}
			if (!inHole) {
				return true;
			}
		}
		return false;
	}

	/** Standard ray-casting test; ring points are [longitude, latitude]. */
	private static boolean inRing(double latitude, double longitude, double[][] ring) {
		boolean inside = false;
		for (int i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			double xi = ring[i][0];
			double yi = ring[i][1];
			double xj = ring[j][0];
			double yj = ring[j][1];
			if (((yi > latitude) != (yj > latitude))
					&& (longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi)) {
				inside = !inside;
			}
		}
		return inside;
	}
}
