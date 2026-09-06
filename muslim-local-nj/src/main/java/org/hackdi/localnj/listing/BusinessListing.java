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

	// Nullable on purpose: an EXPERIENCE post has no business name. The
	// SERVICE-vs-EXPERIENCE rules are enforced by @ValidPost on the request,
	// which can see the post kind - a field annotation here cannot.
	@Size(max = 100)
	private String businessName;

	@NotNull
	@Enumerated(EnumType.STRING)
	private BusinessCategory category;

	@Enumerated(EnumType.STRING)
	private PostKind kind;

	@NotBlank
	@Size(max = 500)
	@Column(length = 500)
	private String comment;

	@Size(max = 255)
	private String websiteUrl;

	@NotNull
	@DecimalMin(NjBounds.MIN_LAT)
	@DecimalMax(NjBounds.MAX_LAT)
	private Double latitude;

	@NotNull
	@DecimalMin(NjBounds.MIN_LNG)
	@DecimalMax(NjBounds.MAX_LNG)
	private Double longitude;

	private Instant createdAt;

	protected BusinessListing() {
	}

	public BusinessListing(String ownerName, String businessName, BusinessCategory category, String comment,
			String websiteUrl, Double latitude, Double longitude) {
		this(ownerName, businessName, category, comment, websiteUrl, latitude, longitude, PostKind.SERVICE);
	}

	public BusinessListing(String ownerName, String businessName, BusinessCategory category, String comment,
			String websiteUrl, Double latitude, Double longitude, PostKind kind) {
		this.ownerName = ownerName;
		this.businessName = businessName;
		this.category = category;
		this.comment = comment;
		this.websiteUrl = websiteUrl;
		this.latitude = latitude;
		this.longitude = longitude;
		this.kind = kind;
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

	/**
	 * Rows written before this column existed have it null. They were all
	 * businesses, so null reads as SERVICE rather than leaking a missing field
	 * out of the API. {@code PostKindBackfill} rewrites them on startup.
	 */
	public PostKind getKind() {
		return kind == null ? PostKind.SERVICE : kind;
	}

	void setKind(PostKind kind) {
		this.kind = kind;
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
