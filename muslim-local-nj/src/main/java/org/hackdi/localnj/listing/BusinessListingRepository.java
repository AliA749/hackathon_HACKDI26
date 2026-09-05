package org.hackdi.localnj.listing;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessListingRepository extends JpaRepository<BusinessListing, Long> {

	List<BusinessListing> findByLatitudeBetweenAndLongitudeBetweenOrderByCreatedAtDesc(
			double minLat, double maxLat, double minLng, double maxLng);
}
