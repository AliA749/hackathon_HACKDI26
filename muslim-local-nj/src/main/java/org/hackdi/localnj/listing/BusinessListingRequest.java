package org.hackdi.localnj.listing;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BusinessListingRequest(
		@NotBlank @Size(max = 80) String ownerName,
		@NotBlank @Size(max = 100) String businessName,
		@NotNull BusinessCategory category,
		@NotBlank @Size(max = 500) String comment,
		@Size(max = 255) @Pattern(regexp = "^(https?://.+)?$", message = "Website must start with http:// or https://") String websiteUrl,
		@NotNull @DecimalMin("38.70") @DecimalMax("41.40") Double latitude,
		@NotNull @DecimalMin("-75.70") @DecimalMax("-73.80") Double longitude) {
}
