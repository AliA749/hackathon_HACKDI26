import { useCallback, useState } from "react";
import { createListing, fetchListings } from "../api/listings.js";

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

	return { listings, status, loadListings, addListing };
}
