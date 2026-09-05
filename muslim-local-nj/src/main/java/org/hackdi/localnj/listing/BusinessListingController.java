package org.hackdi.localnj.listing;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/listings")
public class BusinessListingController {

	private final BusinessListingRepository repository;

	public BusinessListingController(BusinessListingRepository repository) {
		this.repository = repository;
	}

	/**
	 * Fetches pins. All params are optional and composable:
	 * <ul>
	 *   <li>no params -&gt; every listing, newest first</li>
	 *   <li>minLat/maxLat/minLng/maxLng -&gt; pins inside the current map bounds</li>
	 *   <li>q -&gt; keyword search against business name and description</li>
	 *   <li>category -&gt; filter by category</li>
	 * </ul>
	 * Bounds and search/category can be combined, e.g. "search this area".
	 */
	@GetMapping
	public List<BusinessListingResponse> list(
			@RequestParam(required = false) Double minLat,
			@RequestParam(required = false) Double maxLat,
			@RequestParam(required = false) Double minLng,
			@RequestParam(required = false) Double maxLng,
			@RequestParam(required = false) BusinessCategory category,
			@RequestParam(required = false) String q) {
		String query = (q == null || q.isBlank()) ? null : q.trim();
		List<BusinessListing> listings = repository.search(minLat, maxLat, minLng, maxLng, category, query);
		return listings.stream().map(this::toResponse).toList();
	}

	@PostMapping
	public ResponseEntity<BusinessListingResponse> create(@Valid @RequestBody BusinessListingRequest request) {
		BusinessListing saved = repository.save(new BusinessListing(
				request.ownerName().trim(),
				request.businessName().trim(),
				request.category(),
				request.comment().trim(),
				normalizeWebsite(request.websiteUrl()),
				request.latitude(),
				request.longitude()));
		return ResponseEntity
			.created(URI.create("/api/listings/" + saved.getId()))
			.body(toResponse(saved));
	}

	private BusinessListingResponse toResponse(BusinessListing listing) {
		return new BusinessListingResponse(
				listing.getId(),
				listing.getOwnerName(),
				listing.getBusinessName(),
				listing.getCategory(),
				listing.getComment(),
				listing.getWebsiteUrl(),
				listing.getLatitude(),
				listing.getLongitude(),
				listing.getCreatedAt());
	}

	private String normalizeWebsite(String websiteUrl) {
		if (websiteUrl == null || websiteUrl.isBlank()) {
			return "";
		}
		return websiteUrl.trim();
	}
}
