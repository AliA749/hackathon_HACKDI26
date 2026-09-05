import { useCallback, useEffect, useRef, useState } from "react";
import MapView from "./components/MapView.jsx";
import PinComposer from "./components/PinComposer.jsx";
import SearchBar from "./components/SearchBar.jsx";
import ListingSidebar from "./components/ListingSidebar.jsx";
import { useListings } from "./hooks/useListings.js";
import { NJ_BOUNDS } from "./constants/bounds.js";

function toBoundsParams(bounds) {
	return {
		minLat: bounds.getSouth(),
		maxLat: bounds.getNorth(),
		minLng: bounds.getWest(),
		maxLng: bounds.getEast()
	};
}

export default function App() {
	const { listings, status, loadListings, addListing } = useListings();
	const [pendingPosition, setPendingPosition] = useState(null);
	const [composerOpen, setComposerOpen] = useState(false);
	const [activeFilter, setActiveFilter] = useState({});
	const mapRef = useRef(null);
	const lastBoundsRef = useRef(null);

	const handleBoundsChange = useCallback(
		(bounds) => {
			lastBoundsRef.current = bounds;
			loadListings({ bounds: toBoundsParams(bounds), ...activeFilter });
		},
		[loadListings, activeFilter]
	);

	// Safety net fetch on mount: don't rely solely on the map firing its own
	// moveend for the very first paint (fitBounds timing varies by browser).
	// The map's real moveend takes over as soon as it fires.
	useEffect(() => {
		loadListings({});
	}, [loadListings]);

	const handleMapClick = useCallback((latlng) => {
		// Same bounds the backend validates against - a click here can never
		// be rejected by the server for being outside New Jersey.
		if (!NJ_BOUNDS.contains(latlng)) {
			return;
		}
		setPendingPosition(latlng);
		setComposerOpen(true);
	}, []);

	const handleSearch = useCallback(
		(filter) => {
			setActiveFilter(filter);
			const bounds = lastBoundsRef.current;
			loadListings({ bounds: bounds ? toBoundsParams(bounds) : undefined, ...filter });
		},
		[loadListings]
	);

	const handleCreate = useCallback(
		async (payload) => {
			const created = await addListing(payload);
			setComposerOpen(false);
			setPendingPosition(null);
			const map = mapRef.current;
			if (map) {
				map.setView([created.latitude, created.longitude], Math.max(map.getZoom(), 13));
			}
			return created;
		},
		[addListing]
	);

	const handleSelectListing = useCallback((listing) => {
		const map = mapRef.current;
		if (map) {
			map.setView([listing.latitude, listing.longitude], 14);
		}
	}, []);

	const closeComposer = useCallback(() => {
		setComposerOpen(false);
		setPendingPosition(null);
	}, []);

	return (
		<div className="app-shell">
			<aside className="directory" aria-label="Community business directory">
				<header className="brand-block">
					<div className="brand-mark" aria-hidden="true">UL</div>
					<div>
						<h1>Ummah Local NJ</h1>
						<p>Find and share Muslim-owned or Muslim-serving businesses across New Jersey.</p>
					</div>
				</header>

				<SearchBar onSearch={handleSearch} />

				<section className="status-panel" aria-live="polite">
					<span id="statusText">{status}</span>
				</section>

				<section className="listings" aria-label="Business listings">
					<ListingSidebar listings={listings} onSelect={handleSelectListing} />
				</section>
			</aside>

			<main className="map-stage">
				<MapView
					listings={listings}
					pendingPin={pendingPosition}
					onMapClick={handleMapClick}
					onBoundsChange={handleBoundsChange}
					mapRef={mapRef}
				/>
			</main>

			<PinComposer open={composerOpen} position={pendingPosition} onClose={closeComposer} onSubmit={handleCreate} />
		</div>
	);
}
