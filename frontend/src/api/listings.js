// Empty string = relative fetch("/api/...") which the Vite dev proxy (or a
// same-origin production build) handles. Set VITE_API_BASE_URL only when the
// frontend and backend are deployed to different origins.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function fetchListings({ bounds, query, category } = {}) {
	const params = new URLSearchParams();
	if (bounds) {
		params.set("minLat", bounds.minLat);
		params.set("maxLat", bounds.maxLat);
		params.set("minLng", bounds.minLng);
		params.set("maxLng", bounds.maxLng);
	}
	if (query) {
		params.set("q", query);
	}
	if (category) {
		params.set("category", category);
	}

	const response = await fetch(`${API_BASE}/api/listings?${params}`);
	if (!response.ok) {
		throw new Error("Could not load listings from the server.");
	}
	return response.json();
}

export async function createListing(payload) {
	const response = await fetch(`${API_BASE}/api/listings`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		const problem = await response.json().catch(() => null);
		const firstFieldError = problem?.errors && Object.values(problem.errors)[0];
		throw new Error(firstFieldError ?? problem?.message ?? "Could not save this business. Please check the form.");
	}

	return response.json();
}

export async function deleteListing(id) {
	const response = await fetch(`${API_BASE}/api/listings/${id}`, { method: "DELETE" });

	// 404 means someone else already deleted it. The user's intent - "this
	// should not be on the map" - is satisfied either way, so treat it as
	// success and let the caller drop it from the list.
	if (response.ok || response.status === 404) {
		return;
	}

	throw new Error("Could not remove this business. Please try again.");
}
