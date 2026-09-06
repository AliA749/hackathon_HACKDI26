package org.hackdi.localnj.listing;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Covers DELETE /api/listings/{id}. Worth its own test because it is the only
 * destructive endpoint in the API and it is unauthenticated - a regression that
 * turned a 404 into a 204, or that deleted the wrong row, would be silent.
 */
@SpringBootTest
class BusinessListingDeleteTest {

	@Autowired
	private BusinessListingController controller;

	@Autowired
	private BusinessListingRepository repository;

	private BusinessListing persistedListing() {
		return repository.save(new BusinessListing(
				"Test Owner",
				"Deletable Business",
				BusinessCategory.RETAIL,
				"A listing that exists purely to be deleted.",
				"",
				40.7357,
				-74.1724));
	}

	@Test
	void deletingAnExistingListingReturns204AndRemovesTheRow() {
		Long id = persistedListing().getId();

		ResponseEntity<Void> response = controller.delete(id);

		assertTrue(response.getStatusCode().isSameCodeAs(HttpStatus.NO_CONTENT));
		assertFalse(repository.existsById(id), "row should be gone after a successful delete");
	}

	@Test
	void deletingAnUnknownListingReturns404() {
		ResponseEntity<Void> response = controller.delete(-1L);

		assertTrue(response.getStatusCode().isSameCodeAs(HttpStatus.NOT_FOUND));
	}

	@Test
	void deletingOneListingLeavesTheOthersAlone() {
		Long doomed = persistedListing().getId();
		Long survivor = persistedListing().getId();

		controller.delete(doomed);

		assertFalse(repository.existsById(doomed), "the targeted row should be gone");
		assertTrue(repository.existsById(survivor), "an unrelated row must not be touched");
	}
}
