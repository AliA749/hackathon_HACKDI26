// Keep `value` in sync with backend BusinessCategory.java.
//
// `icon` is a Material Symbols ligature name; `ink`/`on` are raw hex rather
// than Tailwind classes on purpose. Tailwind purges by scanning for literal
// class strings, so a name built at runtime (`bg-${category}`) would be
// stripped from the bundle. Inline styles sidestep that entirely.

// Things a business offers. A pin in this group has a name and a website.
export const SERVICE_CATEGORIES = [
	{ value: "BARBER", label: "Barber", icon: "content_cut", ink: "#004331", on: "#6ffbbe" },
	{ value: "FOOD", label: "Food", icon: "restaurant", ink: "#7d4200", on: "#ffdcc3" },
	{ value: "CLOTHING", label: "Clothing", icon: "checkroom", ink: "#006c49", on: "#ffffff" },
	{ value: "EDUCATION", label: "Education", icon: "school", ink: "#226a53", on: "#ffffff" },
	{ value: "HEALTH", label: "Health", icon: "ecg_heart", ink: "#0d5c46", on: "#aaf1d4" },
	{ value: "SERVICES", label: "Services", icon: "handyman", ink: "#3f4944", on: "#ffffff" },
	{ value: "RETAIL", label: "Retail", icon: "storefront", ink: "#5c2f00", on: "#ffdcc3" },
	{ value: "OTHER", label: "Other", icon: "place", ink: "#6f7974", on: "#ffffff" }
];

export const SERVICE = "SERVICE";
export const EXPERIENCE = "EXPERIENCE";

/*
 * Experiences are one look, not a set of categories.
 *
 * Sub-dividing them into Event / Question / Tip was considered and dropped:
 * someone describing what a neighbourhood felt like should not have to stop
 * and file that feeling under a heading. Purple keeps them visually separate
 * from the green-and-brown service palette at a glance on a crowded map.
 *
 * This is presentation only - it is NOT a BusinessCategory value. On the wire
 * an experience carries category OTHER plus kind EXPERIENCE; see
 * BusinessCategory.java for why the enum must not grow a member.
 */
export const EXPERIENCE_CATEGORY = {
	value: "OTHER",
	label: "Experience",
	icon: "forum",
	ink: "#6d3b7a",
	on: "#f6dcff"
};

export const CATEGORIES = SERVICE_CATEGORIES;

const BY_VALUE = new Map(SERVICE_CATEGORIES.map((entry) => [entry.value, entry]));
const FALLBACK = BY_VALUE.get("OTHER");

export function categoryMeta(category) {
	return BY_VALUE.get(category) ?? FALLBACK;
}

export function displayCategory(category) {
	return categoryMeta(category).label;
}

// `kind` is the discriminator. Rows that predate it are businesses.
export function listingKind(listing) {
	return listing?.kind ?? SERVICE;
}

export function isExperience(listing) {
	return listingKind(listing) === EXPERIENCE;
}

/** Colours and label for a pin, keyed on its kind first and trade second. */
export function metaFor(listing) {
	return isExperience(listing) ? EXPERIENCE_CATEGORY : categoryMeta(listing?.category);
}

/** What to call a pin in prose. An experience has no business name to use. */
export function displayTitle(listing) {
	if (isExperience(listing)) {
		return `${listing?.ownerName ?? "Someone"}'s experience`;
	}
	return listing?.businessName ?? "This listing";
}
