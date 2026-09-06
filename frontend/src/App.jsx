import { useCallback, useEffect, useRef, useState } from "react";
import MapView from "./components/MapView.jsx";
import PinComposer from "./components/PinComposer.jsx";
import Header from "./components/Header.jsx";
import ListingSidebar from "./components/ListingSidebar.jsx";
import { useListings } from "./hooks/useListings.js";
import { fetchNjBoundary } from "./api/geo.js";
import { containsPoint } from "./utils/geometry.js";
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
	const { listings, status, setStatus, loadListings, addListing, removeListing } = useListings();
	const [pendingPosition, setPendingPosition] = useState(null);
	const [composerOpen, setComposerOpen] = useState(false);
	const [category, setCategory] = useState(undefined);
	const [activeId, setActiveId] = useState(null);
	const [toast, setToast] = useState(null);
	const [boundary, setBoundary] = useState(null);
	const mapRef = useRef(null);
	const lastBoundsRef = useRef(null);

	// Filters live in a ref as well as state: the map's moveend handler is
	// registered once and would otherwise close over the filter values from the
	// render in which it was created, silently dropping the active category.
	const filterRef = useRef({ query: undefined, category: undefined });

	const handleBoundsChange = useCallback(
		(bounds) => {
			lastBoundsRef.current = bounds;
			loadListings({ bounds: toBoundsParams(bounds), ...filterRef.current });
		},
		[loadListings]
	);

	const reload = useCallback(
		(nextFilter) => {
			filterRef.current = { ...filterRef.current, ...nextFilter };
			const bounds = lastBoundsRef.current;
			loadListings({
				bounds: bounds ? toBoundsParams(bounds) : undefined,
				...filterRef.current
			});
		},
		[loadListings]
	);

	// Safety net fetch on mount: don't rely solely on the map firing its own
	// moveend for the very first paint (fitBounds timing varies by browser).
	// The map's real moveend takes over as soon as it fires.
	useEffect(() => {
		loadListings({});
	}, [loadListings]);

	useEffect(() => {
		fetchNjBoundary().then(setBoundary).catch(() => setBoundary(null));
	}, []);

	useEffect(() => {
		if (!toast) {
			return;
		}
		const timer = setTimeout(() => setToast(null), 4500);
		return () => clearTimeout(timer);
	}, [toast]);

	const handleMapClick = useCallback(
		(latlng) => {
			// Test against the real state outline (same polygon the backend
			// validates with). A bounding box would also accept Philadelphia,
			// Staten Island and the Atlantic. Falls back to the box only while
			// the boundary is still loading.
			const insideNewJersey = boundary
				? containsPoint(boundary, latlng.lat, latlng.lng)
				: NJ_BOUNDS.contains(latlng);

			if (!insideNewJersey) {
				setStatus("That spot is outside New Jersey - listings are limited to NJ.");
				return;
			}

			setPendingPosition(latlng);
			setComposerOpen(true);
		},
		[boundary, setStatus]
	);

	const handleSearch = useCallback((query) => reload({ query }), [reload]);

	const handleCategory = useCallback(
		(next) => {
			setCategory(next);
			reload({ category: next });
		},
		[reload]
	);

	const handleCreate = useCallback(
		async (payload) => {
			const created = await addListing(payload);
			setComposerOpen(false);
			setPendingPosition(null);
			setActiveId(created.id);
			setToast(created);
			const map = mapRef.current;
			if (map) {
				map.setView([created.latitude, created.longitude], Math.max(map.getZoom(), 13));
			}
			return created;
		},
		[addListing]
	);

	const handleSelectListing = useCallback((listing) => {
		setActiveId(listing.id);
		const map = mapRef.current;
		if (map) {
			map.setView([listing.latitude, listing.longitude], Math.max(map.getZoom(), 13));
		}
	}, []);

	const handleDeleteListing = useCallback(
		async (listing) => {
			await removeListing(listing);
			// Clearing this matters: a stale activeId would keep re-applying the
			// "selected" ring to whichever listing later reuses that id.
			setActiveId((current) => (current === listing.id ? null : current));
			setToast((current) => (current?.id === listing.id ? null : current));
		},
		[removeListing]
	);

	const closeComposer = useCallback(() => {
		setComposerOpen(false);
		setPendingPosition(null);
	}, []);

	return (
		<div className="w-full h-full flex flex-col bg-surface overflow-hidden">
			<Header
				activeCategory={category}
				onCategory={handleCategory}
				onSearch={handleSearch}
				onAddClick={() => setStatus("Click anywhere inside New Jersey to place your pin.")}
			/>

			{/*
			  min-h-0 is load-bearing. Flex children default to min-height:auto,
			  which lets the map's content drive its own height - Leaflet then
			  grows the container, the ResizeObserver fires, and the two feed
			  each other until the tile requests run away.
			*/}
			<div className="flex-1 min-h-0 flex flex-row overflow-hidden">
				<ListingSidebar
					listings={listings}
					status={status}
					activeId={activeId}
					onSelect={handleSelectListing}
					onDelete={handleDeleteListing}
				/>

				<main className="flex-1 min-w-0 h-full relative">
					<MapView
						listings={listings}
						boundary={boundary}
						pendingPin={pendingPosition}
						onMapClick={handleMapClick}
						onBoundsChange={handleBoundsChange}
						onStatus={setStatus}
						mapRef={mapRef}
					/>
				</main>
			</div>

			<PinComposer open={composerOpen} position={pendingPosition} onClose={closeComposer} onSubmit={handleCreate} />

			{toast && (
				<aside className="fixed bottom-6 right-6 z-[1300] max-w-sm bg-surface-container-lowest rounded-2xl shadow-[0_16px_36px_rgba(13,92,70,0.18)] p-3.5 flex items-center gap-3 border border-outline-variant/30">
					<span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0">
						<span className="material-symbols-outlined text-[20px]" aria-hidden="true">check_circle</span>
					</span>
					<div className="flex-1 min-w-0 pr-2">
						<div className="font-label-md text-label-md font-bold text-on-surface">Published</div>
						<p className="font-body-sm text-body-sm text-on-surface-variant truncate">
							<span className="font-semibold text-primary">{toast.businessName}</span> is on the map
						</p>
					</div>
					<button
						className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors flex-shrink-0"
						type="button"
						onClick={() => setToast(null)}
						aria-label="Dismiss"
					>
						<span className="material-symbols-outlined text-[16px]">close</span>
					</button>
				</aside>
			)}
		</div>
	);
}
