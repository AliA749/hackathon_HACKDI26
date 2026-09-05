package org.hackdi.localnj.geo;

import java.time.Duration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Serves the New Jersey outline so the frontend can test clicks against the
 * exact same polygon the backend validates with - one source of truth, no
 * chance of the two drifting apart.
 */
@RestController
@RequestMapping("/api/geo")
public class GeoController {

	@GetMapping(value = "/nj-boundary", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Resource> newJerseyBoundary() {
		return ResponseEntity.ok()
			.cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
			.body(new ClassPathResource(NewJerseyBoundary.RESOURCE_PATH));
	}
}
