import { displayCategory } from "../constants/categories.js";

export default function ListingCard({ listing, onSelect }) {
	return (
		<article className="listing-card">
			<button type="button" onClick={() => onSelect(listing)}>
				<h3>{listing.businessName}</h3>
				<div className="meta">Posted by {listing.ownerName}</div>
			</button>
			<div className="category-pill">{displayCategory(listing.category)}</div>
			<p>{listing.comment}</p>
			{listing.websiteUrl && (
				<a className="listing-link" href={listing.websiteUrl} target="_blank" rel="noreferrer">
					{listing.websiteUrl.replace(/^https?:\/\//, "")}
				</a>
			)}
		</article>
	);
}
