import ListingCard from "./ListingCard.jsx";

export default function ListingSidebar({ listings, onSelect }) {
	if (listings.length === 0) {
		return <p className="empty-state">No pins yet. Click the map to add the first one.</p>;
	}

	return (
		<div className="listing-list">
			{listings.map((listing) => (
				<ListingCard key={listing.id} listing={listing} onSelect={onSelect} />
			))}
		</div>
	);
}
