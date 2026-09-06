package org.hackdi.localnj.listing;

import java.time.Instant;

public record BusinessListingResponse(
		Long id,
		String ownerName,
		String businessName,
		BusinessCategory category,
		PostKind kind,
		String comment,
		String websiteUrl,
		Double latitude,
		Double longitude,
		Instant createdAt) {
}
