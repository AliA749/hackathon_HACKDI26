import { categoryMeta } from "../constants/categories.js";
import { initials, timeAgo } from "../utils/time.js";

export default function ListingCard({ listing, active, onSelect }) {
	const meta = categoryMeta(listing.category);
	const posted = timeAgo(listing.createdAt);

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
							{posted && (
								<span className="text-[11px] text-outline whitespace-nowrap">{posted}</span>
							)}
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
		</article>
	);
}
