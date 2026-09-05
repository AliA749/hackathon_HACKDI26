package org.hackdi.localnj.listing;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@InNewJersey
public record BusinessListingRequest(
		@NotBlank @Size(max = 80) String ownerName,
		@NotBlank @Size(max = 100) String businessName,
		@NotNull BusinessCategory category,
		@NotBlank @Size(max = 500) String comment,
		@Size(max = 255) @Pattern(regexp = "^(https?://.+)?$", message = "Website must start with http:// or https://") String websiteUrl,
		@NotNull @DecimalMin(NjBounds.MIN_LAT) @DecimalMax(NjBounds.MAX_LAT) Double latitude,
		@NotNull @DecimalMin(NjBounds.MIN_LNG) @DecimalMax(NjBounds.MAX_LNG) Double longitude) {
}
