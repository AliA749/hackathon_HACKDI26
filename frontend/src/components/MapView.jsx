import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { NJ_BOUNDS, NJ_CENTER, NJ_VIEW_BOUNDS } from "../constants/bounds.js";
import { displayCategory } from "../constants/categories.js";
import { categoryIcon, pendingIcon } from "./markerIcons.js";

function MapEvents({ onMapClick, onBoundsChange }) {
	useMapEvents({
		click(event) {
			onMapClick(event.latlng);
		},
		moveend(event) {
			onBoundsChange(event.target.getBounds());
		}
	});
	return null;
}

// Fixes the classic "gray/empty tiles when the map moves" symptom: Leaflet
// caches the container size at init time, and if that size changes later
// (sidebar toggles, a modal opening, a flex/grid layout settling) without an
// explicit invalidateSize() call, panning reveals tiles for the *old* size
// instead of the new one. A ResizeObserver keeps Leaflet's cached size honest.
//
// Guarded two ways, because invalidateSize() can itself change layout and
// re-trigger the observer - an unguarded version spawns tiles without bound:
//   1. only act when the size actually changed (ignore no-op notifications)
//   2. coalesce into an animation frame so a burst settles into one call
function InvalidateOnResize() {
	const map = useMap();
	useEffect(() => {
		const container = map.getContainer();
		let frame = 0;
		let lastWidth = container.clientWidth;
		let lastHeight = container.clientHeight;

		const observer = new ResizeObserver(() => {
			const { clientWidth, clientHeight } = container;
			if (clientWidth === lastWidth && clientHeight === lastHeight) {
				return;
			}
			lastWidth = clientWidth;
			lastHeight = clientHeight;

			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
		});

		observer.observe(container);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [map]);
	return null;
}

export default function MapView({ listings, pendingPin, onMapClick, onBoundsChange, mapRef }) {
	return (
		<MapContainer
			center={NJ_CENTER}
			zoom={8}
			minZoom={7}
			bounds={NJ_BOUNDS}
			maxBounds={NJ_VIEW_BOUNDS}
			maxBoundsViscosity={0.75}
			className="map-container"
			ref={mapRef}
		>
			{/*
			  tile.openstreetmap.org (a single shared host, no subdomain
			  rotation) throttles/403s under any real traffic - which on a
			  shared hackathon WiFi with several teams hitting it at once
			  shows up as blank gray tiles the moment you pan ("ghosting").
			  CARTO's free raster tiles are no longer an option: they now
			  stamp "API KEY REQUIRED" diagonally across every image. Stadia's
			  "OSM Bright" is keyless on localhost and reads like a nav app.
			  It serves from one host, so the subdomains prop is gone.
			  keepBuffer preloads a wider ring of tiles around the viewport
			  so panning doesn't outrun the cache either.
			*/}
			<TileLayer
				url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
				maxZoom={20}
				keepBuffer={6}
				attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			/>
			<MapEvents onMapClick={onMapClick} onBoundsChange={onBoundsChange} />
			<InvalidateOnResize />

			{listings.map((listing) => (
				<Marker
					key={listing.id}
					position={[listing.latitude, listing.longitude]}
					icon={categoryIcon(listing.category)}
				>
					<Popup>
						<div className="popup">
							<h3>{listing.businessName}</h3>
							<div className="meta">
								{displayCategory(listing.category)} by {listing.ownerName}
							</div>
							<p>{listing.comment}</p>
							{listing.websiteUrl && (
								<a href={listing.websiteUrl} target="_blank" rel="noreferrer">
									{listing.websiteUrl.replace(/^https?:\/\//, "")}
								</a>
							)}
						</div>
					</Popup>
				</Marker>
			))}

			{pendingPin && <Marker position={pendingPin} icon={pendingIcon()} />}
		</MapContainer>
	);
}
