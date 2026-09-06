import { useState } from "react";
import { categoryMeta } from "../constants/categories.js";
import { initials, timeAgo } from "../utils/time.js";

export default function ListingCard({ listing, active, onSelect, onDelete }) {
	const meta = categoryMeta(listing.category);
	const posted = timeAgo(listing.createdAt);

	// Two-step confirm rather than window.confirm(): the delete is permanent,
	// there is no undo and no ownership check, so a single stray click on a
	// touch screen should not be able to destroy someone's listing. Kept inline
	// so it matches the rest of the UI instead of a native browser dialog.
	const [confirming, setConfirming] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Every control inside the card has to stop propagation: the <article>
	// itself is the "fly to this pin" click target.
	const swallow = (event) => {
		event.stopPropagation();
	};

	const handleDelete = async (event) => {
		swallow(event);
		setDeleting(true);
		try {
			await onDelete(listing);
		}
		catch {
			// useListings restores the card and puts the reason in the status
			// line; just re-arm the button here.
			setDeleting(false);
			setConfirming(false);
		}
	};

	return (
		<article
			className={`group rounded-2xl bg-surface-container-lowest p-3 transition-all cursor-pointer ${
				active
					? "shadow-[0_8px_24px_rgba(13,92,70,0.14)] ring-2 ring-primary/30"
					: "shadow-[0_2px_8px_rgba(13,92,70,0.04)] hover:shadow-[0_6px_20px_rgba(13,92,70,0.09)]"
			}`}
			onClick={() => onSelect(listing)}
		>
			<div className="flex gap-3">
				{/* The mock puts a business photo here. No photo field exists, so the
				    tile carries the category mark in that category's colour. */}
				<div
					className="relative w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center"
					style={{ background: meta.ink, color: meta.on }}
					aria-hidden="true"
				>
					<span className="material-symbols-outlined text-[34px]">{meta.icon}</span>
				</div>

				<div className="flex-1 min-w-0 flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between gap-2 mb-0.5">
							<span
								className="font-label-tag text-label-tag px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
								style={{ background: meta.ink, color: meta.on }}
							>
								{meta.label}
							</span>
							<span className="flex items-center gap-1 flex-shrink-0">
								{posted && (
									<span className="text-[11px] text-outline whitespace-nowrap">{posted}</span>
								)}
								{!confirming && (
									<button
										className="w-6 h-6 rounded-full flex items-center justify-center text-outline opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-error-container hover:text-on-error-container transition-all"
										type="button"
										title={`Delete ${listing.businessName}`}
										aria-label={`Delete ${listing.businessName}`}
										onClick={(event) => {
											swallow(event);
											setConfirming(true);
										}}
									>
										<span className="material-symbols-outlined text-[15px]" aria-hidden="true">delete</span>
									</button>
								)}
							</span>
						</div>

						<h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors truncate">
							{listing.businessName}
						</h3>

						<p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
							{listing.comment}
						</p>
					</div>

					<div className="flex items-center justify-between gap-2 pt-2">
						<span className="flex items-center gap-1.5 min-w-0">
							<span className="w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0">
								{initials(listing.ownerName)}
							</span>
							<span className="font-label-md text-label-md text-on-surface-variant truncate">
								{listing.ownerName}
							</span>
						</span>

						{listing.websiteUrl && (
							<a
								className="font-label-tag text-label-tag text-primary hover:underline flex items-center gap-0.5 flex-shrink-0"
								href={listing.websiteUrl}
								target="_blank"
								rel="noreferrer"
								onClick={(event) => event.stopPropagation()}
							>
								<span className="material-symbols-outlined text-[13px]" aria-hidden="true">link</span>
								Visit
							</a>
						)}
					</div>
				</div>
			</div>

			{confirming && (
				<div className="mt-3 pt-3 border-t border-error/20 flex items-center gap-2">
					<p className="flex-1 min-w-0 font-body-sm text-body-sm text-on-surface-variant">
						Delete this listing? This cannot be undone.
					</p>
					<button
						className="h-8 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors flex-shrink-0 disabled:opacity-50"
						type="button"
						disabled={deleting}
						onClick={(event) => {
							swallow(event);
							setConfirming(false);
						}}
					>
						Cancel
					</button>
					<button
						className="h-8 px-3 rounded-lg bg-error text-on-error font-label-md text-label-md font-semibold hover:brightness-110 transition-all flex-shrink-0 disabled:opacity-50 flex items-center gap-1"
						type="button"
						disabled={deleting}
						onClick={handleDelete}
					>
						<span className="material-symbols-outlined text-[15px]" aria-hidden="true">delete</span>
						{deleting ? "Deleting..." : "Delete"}
					</button>
				</div>
			)}
		</article>
	);
}
