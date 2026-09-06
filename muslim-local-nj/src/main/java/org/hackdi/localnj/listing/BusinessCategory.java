package org.hackdi.localnj.listing;

/**
 * The trade a business is in.
 *
 * <p>Deliberately has no EXPERIENCE member. Whether a pin is a business or an
 * experience is {@link PostKind}, a separate column - the two are orthogonal,
 * and folding the kind in here would mean every future experience sub-category
 * had to be a fake "trade" too.
 *
 * <p>There is also a concrete reason not to add members to this enum casually:
 * Hibernate emits a CHECK constraint listing these values, and
 * {@code ddl-auto=update} will not widen it on a database that already has
 * rows. Adding a value here breaks every existing checkout until the schema is
 * rebuilt. Experiences carry {@link #OTHER} plus {@code kind = EXPERIENCE}.
 */
public enum BusinessCategory {
	FOOD,
	BARBER,
	CLOTHING,
	EDUCATION,
	HEALTH,
	SERVICES,
	RETAIL,
	OTHER
}
