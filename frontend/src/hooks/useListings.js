import { useCallback, useState } from "react";
import { createListing, deleteListing, fetchListings } from "../api/listings.js";

export function useListings() {
	const [listings, setListings] = useState([]);
	const [status, setStatus] = useState("Loading listings...");

	const loadListings = useCallback(async ({ bounds, query, category } = {}) => {
		try {
			const results = await fetchListings({ bounds, query, category });
			setListings(results);
			setStatus(
				results.length
					? `${results.length} ${results.length === 1 ? "business" : "businesses"} found.`
					: "No businesses match this view yet."
			);
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
		setStatus(`${created.businessName} is now visible on the map.`);
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
			setStatus(`${listing.businessName} was removed.`);
		}
		catch (error) {
			setListings(snapshot);
			setStatus(error.message);
			throw error;
		}
	}, [listings]);

	return { listings, status, setStatus, loadListings, addListing, removeListing };
}
