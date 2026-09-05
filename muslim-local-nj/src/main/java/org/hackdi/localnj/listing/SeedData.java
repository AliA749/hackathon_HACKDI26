package org.hackdi.localnj.listing;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SeedData implements CommandLineRunner {

	private final BusinessListingRepository repository;

	public SeedData(BusinessListingRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(String... args) {
		if (repository.count() > 0) {
			return;
		}

		repository.save(new BusinessListing(
				"Mohammad Shaheer Siddiqi",
				"Shaheer Barber Studio",
				BusinessCategory.BARBER,
				"Local barber studio welcoming Muslim clients across central New Jersey. Book cuts, beard lineups, and community referrals.",
				"https://example.com/shaheer-barber",
				40.5187,
				-74.4121));
		repository.save(new BusinessListing(
				"Amina Rahman",
				"Halal Meal Prep NJ",
				BusinessCategory.FOOD,
				"Weekly halal meal prep for families, students, and busy professionals near Edison and Piscataway.",
				"https://example.com/halal-meal-prep",
				40.5549,
				-74.4632));
		repository.save(new BusinessListing(
				"Yusuf Khan",
				"Garden State Tutoring",
				BusinessCategory.EDUCATION,
				"Math and SAT tutoring with flexible evening sessions for local Muslim families.",
				"",
				40.7357,
				-74.1724));
	}
}
