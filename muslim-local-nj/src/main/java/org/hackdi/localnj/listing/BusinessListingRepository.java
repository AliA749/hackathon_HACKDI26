package org.hackdi.localnj.listing;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BusinessListingRepository extends JpaRepository<BusinessListing, Long> {

	/**
	 * Single query backing both "pins in view" and "search". Every filter is
	 * optional: pass nulls for whichever ones the caller did not supply and
	 * they are skipped.
	 */
	@Query("""
			SELECT l FROM BusinessListing l
			WHERE (:minLat IS NULL OR l.latitude BETWEEN :minLat AND :maxLat)
			  AND (:minLng IS NULL OR l.longitude BETWEEN :minLng AND :maxLng)
			  AND (:category IS NULL OR l.category = :category)
			  AND (:query IS NULL
			       OR LOWER(l.businessName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))
			       OR LOWER(l.comment) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))
			ORDER BY l.createdAt DESC
			""")
	List<BusinessListing> search(
			@Param("minLat") Double minLat,
			@Param("maxLat") Double maxLat,
			@Param("minLng") Double minLng,
			@Param("maxLng") Double maxLng,
			@Param("category") BusinessCategory category,
			@Param("query") String query);
}
