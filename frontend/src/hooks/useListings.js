import { useCallback, useState } from "react";
import { createListing, deleteListing, fetchListings } from "../api/listings.js";
import { displayTitle, isExperience } from "../constants/categories.js";

const countOf = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;
const businesses = (n) => countOf(n, "business", "businesses");
const experiences = (n) => countOf(n, "experience", "experiences");

// The list mixes two kinds of pin, so "4 businesses found" would be wrong the
// moment an experience is in view. Name whichever kinds are actually there.
function describeResults(results) {
	if (results.length === 0) {
		return "Nothing matches this view yet.";
	}
	const experienceCount = results.filter(isExperience).length;
	const businessCount = results.length - experienceCount;

	if (experienceCount === 0) {
		return `${businesses(businessCount)} found.`;
	}
	if (businessCount === 0) {
		return `${experiences(experienceCount)} shared here.`;
	}
	return `${businesses(businessCount)} and ${experiences(experienceCount)} found.`;
}

export function useListings() {
	const [listings, setListings] = useState([]);
	const [status, setStatus] = useState("Loading listings...");

	const loadListings = useCallback(async ({ bounds, query, category, kind } = {}) => {
		try {
			const results = await fetchListings({ bounds, query, category, kind });
			setListings(results);
			setStatus(describeResults(results));
			return results;
		}
		catch (error) {
			setStatus(error.message);
			return [];
		}
	}, []);

	const addListing = useCallback(async (payload) => {
		const created = await createListing(payload);
		setListings((current) => [created, ...current.filter((listing) => listing.id !== created.id)]);
		setStatus(`${displayTitle(created)} is now visible on the map.`);
		return created;
	}, []);

	// Optimistic: the card disappears on click, and comes back if the server
	// rejects the delete. Waiting for the round-trip instead would leave the
	// card sitting there looking like the button did nothing.
	const removeListing = useCallback(async (listing) => {
		const snapshot = listings;
		setListings((current) => current.filter((item) => item.id !== listing.id));

		try {
			await deleteListing(listing.id);
			setStatus(`${displayTitle(listing)} was removed.`);
		}
		catch (error) {
			setListings(snapshot);
			setStatus(error.message);
			throw error;
		}
	}, [listings]);

	return { listings, status, setStatus, loadListings, addListing, removeListing };
}
