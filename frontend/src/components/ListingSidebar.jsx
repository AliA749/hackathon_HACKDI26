import ListingCard from "./ListingCard.jsx";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function ListingSidebar({ listings, status, activeId, onSelect, onDelete }) {
	// The mock hardcodes "3 community check-ins in the last 15m". This counts
	// the real listings instead, so the number always tells the truth.
	const recent = listings.filter((listing) => {
		const created = new Date(listing.createdAt).getTime();
		return !Number.isNaN(created) && Date.now() - created < DAY_MS;
	}).length;

	return (
		<aside
			className="w-full lg:w-[420px] h-full flex-shrink-0 bg-surface-container-lowest flex flex-col z-30 shadow-[4px_0_24px_rgba(13,92,70,0.06)] min-h-0"
			aria-label="Community business directory"
		>
			<div className="p-4 flex flex-col gap-3 flex-shrink-0">
				<div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary-container/30 text-on-secondary-container">
					<div className="flex items-center gap-2 min-w-0">
						<span className="relative flex h-2.5 w-2.5 flex-shrink-0">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
						</span>
						<span className="font-label-md text-label-md font-semibold tracking-tight truncate">
							{listings.length} {listings.length === 1 ? "business" : "businesses"} in this view
							{recent > 0 && ` · ${recent} added today`}
						</span>
					</div>
					<span className="font-label-tag text-label-tag bg-surface-container-lowest px-2 py-0.5 rounded-full text-secondary font-bold flex-shrink-0">
						LIVE
					</span>
				</div>

				{status && (
					<p
						className="px-3 py-2 rounded-xl bg-surface-container-low font-body-sm text-body-sm text-on-surface-variant"
						aria-live="polite"
					>
						{status}
					</p>
				)}
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-none">
				{listings.length === 0 ? (
					<div className="mt-10 flex flex-col items-center text-center gap-2 px-4">
						<span className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline">
							<span className="material-symbols-outlined text-[28px]" aria-hidden="true">location_off</span>
						</span>
						<p className="font-label-lg text-label-lg text-on-surface">No businesses in this view</p>
						<p className="font-body-sm text-body-sm text-on-surface-variant">
							Pan the map, clear the filters, or click anywhere in New Jersey to add the first pin.
						</p>
					</div>
				) : (
					listings.map((listing) => (
						<ListingCard
							key={listing.id}
							listing={listing}
							active={listing.id === activeId}
							onSelect={onSelect}
							onDelete={onDelete}
						/>
					))
				)}
			</div>

			<div className="p-3 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_-4px_16px_rgba(13,92,70,0.06)] flex items-center gap-2 flex-shrink-0">
				<p className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-surface-container-low text-on-surface-variant font-label-md text-label-md text-center px-2">
					<span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">touch_app</span>
					Click the map to add a business
				</p>
			</div>
		</aside>
	);
}
