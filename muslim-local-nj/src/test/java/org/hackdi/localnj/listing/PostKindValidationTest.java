package org.hackdi.localnj.listing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Locks down the SERVICE/EXPERIENCE shape rules.
 *
 * <p>These matter beyond tidiness: the composer never asks an experience poster
 * for a business name or a link, so if the server accepted them anyway, a
 * hand-rolled POST could park an advertisement in the community feed wearing an
 * experience's clothes.
 */
@SpringBootTest
class PostKindValidationTest {

	@Autowired
	private Validator validator;

	private BusinessListingRequest request(String businessName, PostKind kind, String websiteUrl) {
		return new BusinessListingRequest(
				"Aisha K",
				businessName,
				BusinessCategory.OTHER,
				kind,
				"Parking is easy on Fridays and the area feels welcoming.",
				websiteUrl,
				40.7357,
				-74.1724);
	}

	private Set<String> fieldsWithErrors(BusinessListingRequest request) {
		return validator.validate(request).stream()
			.map((violation) -> violation.getPropertyPath().toString())
			.collect(Collectors.toSet());
	}

	@Test
	void experienceWithNeitherNameNorWebsiteIsValid() {
		assertTrue(validator.validate(request(null, PostKind.EXPERIENCE, null)).isEmpty());
		assertTrue(validator.validate(request("", PostKind.EXPERIENCE, "")).isEmpty());
	}

	@Test
	void experienceCarryingABusinessNameIsRejected() {
		assertTrue(fieldsWithErrors(request("Buy My Stuff", PostKind.EXPERIENCE, null)).contains("businessName"));
	}

	@Test
	void experienceCarryingAWebsiteIsRejected() {
		assertTrue(fieldsWithErrors(request(null, PostKind.EXPERIENCE, "https://spam.example.com")).contains("websiteUrl"));
	}

	@Test
	void serviceWithoutABusinessNameIsRejected() {
		assertTrue(fieldsWithErrors(request(null, PostKind.SERVICE, null)).contains("businessName"));
		assertTrue(fieldsWithErrors(request("   ", PostKind.SERVICE, null)).contains("businessName"));
	}

	@Test
	void serviceWithABusinessNameIsValid() {
		assertTrue(validator.validate(request("Halal Meal Prep NJ", PostKind.SERVICE, "https://example.com")).isEmpty());
	}

	@Test
	void absentKindDefaultsToServiceSoOlderClientsKeepWorking() {
		BusinessListingRequest legacy = request("Halal Meal Prep NJ", null, null);
		assertEquals(PostKind.SERVICE, legacy.kindOrDefault());
		assertTrue(validator.validate(legacy).isEmpty());
	}

	/**
	 * The enum must not grow an EXPERIENCE member: Hibernate emits a CHECK
	 * constraint from these values and ddl-auto=update will not widen it on a
	 * database that already holds rows.
	 */
	@Test
	void businessCategoryHasNoExperienceMember() {
		for (BusinessCategory category : BusinessCategory.values()) {
			assertTrue(!category.name().equals("EXPERIENCE"),
					"EXPERIENCE belongs to PostKind, not BusinessCategory - see BusinessCategory javadoc");
		}
	}
}
