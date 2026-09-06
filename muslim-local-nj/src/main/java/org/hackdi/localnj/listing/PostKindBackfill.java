package org.hackdi.localnj.listing;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stamps {@code kind} onto rows that predate the column.
 *
 * <p>Every one of them is a business, because experiences did not exist yet.
 * Without this the search query's {@code l.kind = :kind} filter would silently
 * omit them from "Businesses" - a NULL never equals anything in SQL - so the
 * whole imported directory would vanish the first time anyone used the filter.
 *
 * <p>Runs before {@code SeedData} so an empty database is not seeded and then
 * pointlessly scanned.
 */
@Component
@Order(1)
public class PostKindBackfill implements CommandLineRunner {

	private final BusinessListingRepository repository;

	public PostKindBackfill(BusinessListingRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional
	public void run(String... args) {
		var stale = repository.findByKindIsNull();
		if (stale.isEmpty()) {
			return;
		}
		stale.forEach((listing) -> listing.setKind(PostKind.SERVICE));
		repository.saveAll(stale);
		System.out.println("Backfilled kind on " + stale.size() + " listing(s)");
	}
}
