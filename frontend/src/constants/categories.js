// Keep `value` in sync with backend BusinessCategory.java.
//
// `icon` is a Material Symbols ligature name; `ink`/`on` are raw hex rather
// than Tailwind classes on purpose. Tailwind purges by scanning for literal
// class strings, so a name built at runtime (`bg-${category}`) would be
// stripped from the bundle. Inline styles sidestep that entirely.
export const CATEGORIES = [
	{ value: "BARBER", label: "Barber", icon: "content_cut", ink: "#004331", on: "#6ffbbe" },
	{ value: "FOOD", label: "Food", icon: "restaurant", ink: "#7d4200", on: "#ffdcc3" },
	{ value: "CLOTHING", label: "Clothing", icon: "checkroom", ink: "#006c49", on: "#ffffff" },
	{ value: "EDUCATION", label: "Education", icon: "school", ink: "#226a53", on: "#ffffff" },
	{ value: "HEALTH", label: "Health", icon: "ecg_heart", ink: "#0d5c46", on: "#aaf1d4" },
	{ value: "SERVICES", label: "Services", icon: "handyman", ink: "#3f4944", on: "#ffffff" },
	{ value: "RETAIL", label: "Retail", icon: "storefront", ink: "#5c2f00", on: "#ffdcc3" },
	{ value: "OTHER", label: "Other", icon: "place", ink: "#6f7974", on: "#ffffff" }
];

const BY_VALUE = new Map(CATEGORIES.map((entry) => [entry.value, entry]));

const FALLBACK = BY_VALUE.get("OTHER");

export function categoryMeta(category) {
	return BY_VALUE.get(category) ?? FALLBACK;
}

export function displayCategory(category) {
	return categoryMeta(category).label;
}
