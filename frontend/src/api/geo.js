const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * The New Jersey outline, served by the backend so the map tests clicks
 * against the exact same polygon the API validates against.
 */
export async function fetchNjBoundary() {
	const response = await fetch(`${API_BASE}/api/geo/nj-boundary`);
	if (!response.ok) {
		throw new Error("Could not load the New Jersey boundary.");
	}
	return response.json();
}
