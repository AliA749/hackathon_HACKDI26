// Keep in sync with backend BusinessCategory.java
export const CATEGORIES = [
	{ value: "BARBER", label: "Barber" },
	{ value: "FOOD", label: "Food" },
	{ value: "CLOTHING", label: "Clothing" },
	{ value: "EDUCATION", label: "Education" },
	{ value: "HEALTH", label: "Health" },
	{ value: "SERVICES", label: "Services" },
	{ value: "RETAIL", label: "Retail" },
	{ value: "OTHER", label: "Other" }
];

export function displayCategory(category) {
	const match = CATEGORIES.find((option) => option.value === category);
	return match ? match.label : category;
}
