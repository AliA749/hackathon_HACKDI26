package org.hackdi.localnj.listing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
public class BusinessListing {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Size(max = 80)
	private String ownerName;

	@NotBlank
	@Size(max = 100)
	private String businessName;

	@NotNull
	@Enumerated(EnumType.STRING)
	private BusinessCategory category;

	@NotBlank
	@Size(max = 500)
	@Column(length = 500)
	private String comment;

	@Size(max = 255)
	private String websiteUrl;

	@NotNull
	@DecimalMin("38.70")
	@DecimalMax("41.40")
	private Double latitude;

	@NotNull
	@DecimalMin("-75.70")
	@DecimalMax("-73.80")
	private Double longitude;

	private Instant createdAt;

	protected BusinessListing() {
	}

	public BusinessListing(String ownerName, String businessName, BusinessCategory category, String comment,
			String websiteUrl, Double latitude, Double longitude) {
		this.ownerName = ownerName;
		this.businessName = businessName;
		this.category = category;
		this.comment = comment;
		this.websiteUrl = websiteUrl;
		this.latitude = latitude;
		this.longitude = longitude;
	}

	@PrePersist
	void setCreatedAt() {
		this.createdAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public String getOwnerName() {
		return ownerName;
	}

	public String getBusinessName() {
		return businessName;
	}

	public BusinessCategory getCategory() {
		return category;
	}

	public String getComment() {
		return comment;
	}

	public String getWebsiteUrl() {
		return websiteUrl;
	}

	public Double getLatitude() {
		return latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
