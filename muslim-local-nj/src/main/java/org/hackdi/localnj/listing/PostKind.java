package org.hackdi.localnj.listing;

/**
 * The two things a pin can be.
 *
 * <p>{@link #SERVICE} is a business: it has a name, a category like FOOD or
 * BARBER, and optionally a website. {@link #EXPERIENCE} is somebody describing
 * what a place or area was actually like - no business name and no website,
 * because it is not advertising anything.
 *
 * <p>Kept as its own field rather than inferred from the category so the API
 * can answer "show me only experiences" directly, and so an experience can
 * grow its own categories later without the two concepts fighting.
 */
public enum PostKind {
	SERVICE,
	EXPERIENCE
}
