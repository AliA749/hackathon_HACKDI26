package org.hackdi.localnj.listing;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.Comparator;
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

	@GetMapping
	public List<BusinessListingResponse> list(
			@RequestParam(required = false) Double minLat,
			@RequestParam(required = false) Double maxLat,
			@RequestParam(required = false) Double minLng,
			@RequestParam(required = false) Double maxLng) {
		List<BusinessListing> listings;
		if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
			listings = repository.findByLatitudeBetweenAndLongitudeBetweenOrderByCreatedAtDesc(
					minLat, maxLat, minLng, maxLng);
		}
		else {
			listings = repository.findAll().stream()
				.sorted(Comparator.comparing(BusinessListing::getCreatedAt).reversed())
				.toList();
		}
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
