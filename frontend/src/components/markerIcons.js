import L from "leaflet";

const CATEGORY_COLORS = {
	FOOD: "#7a3f2d",
	BARBER: "#16302b",
	CLOTHING: "#2f8f70",
	EDUCATION: "#c59b2d",
	HEALTH: "#2f8f70",
	SERVICES: "#2f8f70",
	RETAIL: "#2f8f70",
	OTHER: "#40514d"
};

export function categoryIcon(category) {
	const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.OTHER;
	return L.divIcon({
		className: "",
		html: `<div class="business-marker" style="background:${color}">${category.charAt(0)}</div>`,
		iconSize: [34, 34],
		iconAnchor: [17, 17]
	});
}

export function pendingIcon() {
	return L.divIcon({
		className: "",
		html: '<div class="business-marker pending">+</div>',
		iconSize: [34, 34],
		iconAnchor: [17, 17]
	});
}
