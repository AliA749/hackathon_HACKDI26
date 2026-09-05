package org.hackdi.localnj.geo;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import tools.jackson.databind.ObjectMapper;

class NewJerseyBoundaryTest {

	private final NewJerseyBoundary boundary = new NewJerseyBoundary(new ObjectMapper());

	@ParameterizedTest(name = "{0} is in New Jersey")
	@CsvSource({
		"Newark,         40.7357, -74.1724",
		"Edison,         40.5187, -74.4121",
		"Cape May,       38.9351, -74.9060",
		"Trenton,        40.2206, -74.7597",
		"Atlantic City,  39.3643, -74.4229",
		"Jersey City,    40.7178, -74.0431",
		"Paterson,       40.9168, -74.1718",
		"Camden,         39.9259, -75.1196"
	})
	void acceptsPlacesInsideNewJersey(String name, double latitude, double longitude) {
		assertTrue(boundary.contains(latitude, longitude), name + " should be inside New Jersey");
	}

	@ParameterizedTest(name = "{0} is not in New Jersey")
	@CsvSource({
		"Philadelphia,   39.9526, -75.1652",
		"Staten Island,  40.5795, -74.1502",
		"Manhattan,      40.7831, -73.9712",
		"Bronx,          40.8448, -73.8648",
		"Wilmington DE,  39.7391, -75.5398",
		"Atlantic Ocean, 39.3000, -74.0000"
	})
	void rejectsPlacesOutsideNewJersey(String name, double latitude, double longitude) {
		assertFalse(boundary.contains(latitude, longitude), name + " should be outside New Jersey");
	}

	@Test
	void rejectsCoordinatesFarOutsideTheBoundingBox() {
		assertFalse(boundary.contains(0.0, 0.0));
		assertFalse(boundary.contains(51.5074, -0.1278));
	}
}
