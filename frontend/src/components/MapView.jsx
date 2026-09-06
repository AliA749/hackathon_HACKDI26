import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Circle, GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { NJ_BOUNDS, NJ_CENTER, NJ_VIEW_BOUNDS } from "../constants/bounds.js";
import { isExperience, metaFor } from "../constants/categories.js";
import { businessPin, pendingIcon, userLocationIcon } from "./markerIcons.js";
import { avatarFor } from "../utils/media.js";
import { initials, timeAgo } from "../utils/time.js";

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

/*
 * Floating UI that lives inside the Leaflet container. Without
 * disableClickPropagation, a click on a zoom button also reaches the map's own
 * DOM listener and opens the "add a business" composer underneath the cursor.
 */
function MapOverlay({ className, children }) {
	const ref = useRef(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) {
			return;
		}
		L.DomEvent.disableClickPropagation(node);
		L.DomEvent.disableScrollPropagation(node);
	}, []);

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
}

/*
 * Turns a GeolocationPositionError into something a user can act on. The
 * browser's own .message is either empty or a generic "User denied
 * Geolocation", which does not tell anyone what to do next - and on Windows the
 * overwhelmingly common cause is the OS-level location toggle, not the site
 * permission, so that case gets called out by name.
 */
function locationErrorMessage(error) {
	switch (error?.code) {
		case 1: // PERMISSION_DENIED
			return "Location permission was blocked. Click the icon at the left of the address bar, set Location to Allow, then try again.";
		case 2: // POSITION_UNAVAILABLE
			return "Your device could not provide a location. On Windows, check Settings > Privacy & security > Location is on for desktop apps.";
		case 3: // TIMEOUT
			return "Timed out finding your location. Try again - the first fix can be slow without Wi-Fi or GPS.";
		default:
			return "Could not find your location.";
	}
}

function MapControls({ onStatus, onLocated }) {
	const map = useMap();
	const [locating, setLocating] = useState(false);

	const locate = useCallback(() => {
		// Geolocation is gated on a secure context. localhost counts as secure,
		// but the moment someone opens the Vite "Network" URL (http://192.168.x.x)
		// to demo on a phone, navigator.geolocation is simply undefined - which
		// looks like a dead button unless we say so.
		if (!navigator.geolocation) {
			onStatus(
				window.isSecureContext
					? "This browser does not support location lookup."
					: "Location needs a secure page. Use http://localhost:5173 rather than the network address."
			);
			return;
		}

		setLocating(true);
		onStatus("Finding your location...");

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLocating(false);
				const { latitude, longitude, accuracy } = position.coords;
				const latlng = L.latLng(latitude, longitude);

				onLocated({ latlng, accuracy });

				// Deliberately do NOT move the map when the user is outside New
				// Jersey. Flying to Ohio would show an empty map outside the
				// coverage area and silently drop this warning: moving fires
				// moveend, which kicks off the listings fetch, and that fetch
				// resolves after any status we set here - so the result count
				// always wins the race for the status line. Staying put means
				// there is no moveend and the message survives.
				if (!NJ_BOUNDS.contains(latlng)) {
					onStatus("You're outside New Jersey - this map only covers NJ businesses.");
					return;
				}

				// Inside NJ the map does move, and the resulting "N businesses
				// found." is a better status line than anything we'd write here.
				map.flyTo(latlng, Math.max(map.getZoom(), 13));
			},
			(error) => {
				setLocating(false);
				onLocated(null);
				onStatus(locationErrorMessage(error));
			},
			// High accuracy because "which town am I in" is the whole point.
			// 12s is long enough for a cold GPS/Wi-Fi fix; the 60s cache makes a
			// second click instant.
			{ enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
		);
	}, [map, onLocated, onStatus]);

	return (
		<MapOverlay className="absolute right-4 top-4 z-[1000] flex flex-col items-center gap-2">
			<button
				className="w-10 h-10 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md text-on-surface hover:text-primary flex items-center justify-center shadow-[0_4px_14px_rgba(13,92,70,0.1)] transition-transform active:scale-90 disabled:opacity-70"
				type="button"
				title="Find my location"
				aria-label="Find my location"
				disabled={locating}
				onClick={locate}
			>
				<span
					className={`material-symbols-outlined text-[20px] ${locating ? "animate-spin text-primary" : ""}`}
					aria-hidden="true"
				>
					{locating ? "progress_activity" : "my_location"}
				</span>
			</button>

			<button
				className="w-10 h-10 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md text-on-surface hover:text-primary flex items-center justify-center shadow-[0_4px_14px_rgba(13,92,70,0.1)] transition-transform active:scale-90"
				type="button"
				title="Show all of New Jersey"
				aria-label="Show all of New Jersey"
				onClick={() => map.fitBounds(NJ_BOUNDS)}
			>
				<span className="material-symbols-outlined text-[20px]" aria-hidden="true">fit_screen</span>
			</button>

			<div className="flex flex-col bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-[0_4px_14px_rgba(13,92,70,0.1)] overflow-hidden">
				<button
					className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
					type="button"
					title="Zoom in"
					onClick={() => map.zoomIn()}
				>
					<span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
				</button>
				<div className="h-[1px] w-full bg-surface-container-high"></div>
				<button
					className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
					type="button"
					title="Zoom out"
					onClick={() => map.zoomOut()}
				>
					<span className="material-symbols-outlined text-[20px]" aria-hidden="true">remove</span>
				</button>
			</div>
		</MapOverlay>
	);
}

// Only legend entries for categories actually on screen, so the key never
// advertises a pin colour the user cannot see.
function MapLegend({ listings }) {
	// Keyed by label, not category value: an experience rides on the OTHER
	// category, so keying by value would collapse "Experience" and "Other"
	// into a single legend entry.
	const present = [...new Map(listings.map((listing) => {
		const meta = metaFor(listing);
		return [meta.label, meta];
	})).values()];

	if (present.length === 0) {
		return null;
	}

	return (
		<MapOverlay className="absolute bottom-6 left-4 z-[1000] hidden md:flex items-center gap-3 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_6px_20px_rgba(13,92,70,0.1)] border border-outline-variant/30 max-w-[calc(100%-2rem)] overflow-x-auto scrollbar-none">
			<span className="font-label-tag text-label-tag uppercase tracking-wider text-outline font-bold mr-1 flex-shrink-0">
				Key:
			</span>
			{present.map((meta) => (
				<div key={meta.value} className="flex items-center gap-1.5 flex-shrink-0">
					<span
						className="w-5 h-5 rounded-full flex items-center justify-center"
						style={{ background: meta.ink, color: meta.on }}
					>
						<span className="material-symbols-outlined text-[12px]" aria-hidden="true">{meta.icon}</span>
					</span>
					<span className="font-label-md text-label-md text-on-surface whitespace-nowrap">{meta.label}</span>
				</div>
			))}
		</MapOverlay>
	);
}

function ListingPopup({ listing }) {
	const meta = metaFor(listing);
	const posted = timeAgo(listing.createdAt);
	const experience = isExperience(listing);
	// Businesses have no image at all, so this is null for them and the circle
	// falls through to the owner's initials - which is what it is standing next
	// to anyway. Only experiences carry a generated avatar.
	const image = avatarFor(listing, 96);
	const [imageFailed, setImageFailed] = useState(false);

	return (
		<div className="w-72 p-4 bg-surface-container-lowest">
			<div className="flex items-start justify-between gap-2 pb-2.5 border-b border-surface-container-high/60">
				<div className="flex items-center gap-2.5 min-w-0">
					<span
						className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 overflow-hidden"
						style={{ background: meta.ink, color: meta.on }}
					>
						{image && !imageFailed ? (
							<img
								className="w-full h-full object-cover"
								src={image}
								alt=""
								loading="lazy"
								onError={() => setImageFailed(true)}
							/>
						) : (
							initials(listing.ownerName)
						)}
					</span>
					<div className="min-w-0">
						<h4 className="font-label-lg text-label-lg text-on-surface font-bold truncate">
							{listing.ownerName}
						</h4>
						{posted && <span className="text-[11px] text-outline">{posted}</span>}
					</div>
				</div>
			</div>

			{/* An experience has no business name, so the row carries only the
			    kind tag - there is nothing to advertise. */}
			<div className="mt-2.5 px-2.5 py-1 rounded-lg bg-surface-container-low flex items-center justify-between gap-2">
				{experience ? (
					<span className="font-label-md text-label-md text-on-surface-variant truncate">
						What this area is like
					</span>
				) : (
					<span className="font-label-md text-label-md font-semibold text-primary truncate flex items-center gap-1">
						<span className="material-symbols-outlined text-[14px]" aria-hidden="true">store</span>
						{listing.businessName}
					</span>
				)}
				<span
					className="font-label-tag text-label-tag px-2 py-0.5 rounded-full flex-shrink-0"
					style={{ background: meta.ink, color: meta.on }}
				>
					{meta.label}
				</span>
			</div>

			<p className="font-body-sm text-body-sm text-on-surface mt-2.5 leading-relaxed">{listing.comment}</p>

			{!experience && listing.websiteUrl && (
				<a
					className="mt-3 inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline break-all"
					href={listing.websiteUrl}
					target="_blank"
					rel="noreferrer"
				>
					<span className="material-symbols-outlined text-[15px]" aria-hidden="true">link</span>
					{listing.websiteUrl.replace(/^https?:\/\//, "")}
				</a>
			)}
		</div>
	);
}

export default function MapView({ listings, boundary, pendingPin, onMapClick, onBoundsChange, onStatus, mapRef }) {
	const [userPosition, setUserPosition] = useState(null);

	return (
		<MapContainer
			center={NJ_CENTER}
			zoom={8}
			minZoom={7}
			bounds={NJ_BOUNDS}
			maxBounds={NJ_VIEW_BOUNDS}
			maxBoundsViscosity={0.75}
			zoomControl={false}
			className="w-full h-full"
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
				/*
				  The OpenStreetMap credit covers two separate things now: the
				  basemap tiles, and the imported business listings themselves
				  (see tools/import-osm.mjs). ODbL requires attribution for the
				  data, not just the imagery, so this line is a licence
				  obligation - don't trim it.
				*/
				attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (tiles &amp; imported listings, ODbL)'
			/>
			<MapEvents onMapClick={onMapClick} onBoundsChange={onBoundsChange} />
			<InvalidateOnResize />
			<MapControls onStatus={onStatus} onLocated={setUserPosition} />
			<MapLegend listings={listings} />

			{/* Shows users exactly where they're allowed to drop a pin. */}
			{boundary && (
				<GeoJSON
					data={boundary}
					interactive={false}
					style={{ color: "#004331", weight: 2, fillColor: "#2f8f70", fillOpacity: 0.05 }}
				/>
			)}

			{listings.map((listing) => (
				<Marker
					key={listing.id}
					position={[listing.latitude, listing.longitude]}
					icon={businessPin(listing)}
				>
					<Popup>
						<ListingPopup listing={listing} />
					</Popup>
				</Marker>
			))}

			{/*
			  The accuracy circle is the honest part of the answer: a Wi-Fi fix
			  can be a kilometre wide, and a bare dot would claim precision the
			  reading does not have. interactive={false} keeps it from eating
			  clicks meant for the map underneath.
			*/}
			{userPosition && (
				<>
					<Circle
						center={userPosition.latlng}
						radius={userPosition.accuracy}
						interactive={false}
						pathOptions={{ color: "#1a73e8", weight: 1, fillColor: "#1a73e8", fillOpacity: 0.12 }}
					/>
					<Marker position={userPosition.latlng} icon={userLocationIcon()}>
						<Popup>
							<div className="px-1 py-0.5 font-body-sm text-body-sm text-on-surface">
								You are here
								<span className="block text-[11px] text-outline">
									accurate to about {Math.round(userPosition.accuracy)} m
								</span>
							</div>
						</Popup>
					</Marker>
				</>
			)}

			{pendingPin && <Marker position={pendingPin} icon={pendingIcon()} />}
		</MapContainer>
	);
}
