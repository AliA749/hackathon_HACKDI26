import { isExperience } from "../constants/categories.js";

/*
 * Imagery for pins and cards.
 *
 * Nothing here is a real photograph of a real business - there is no photo
 * field in the schema and none of the imported OpenStreetMap records carry an
 * `image` tag. What these produce is a *representative* image chosen to suit
 * the category, and a generated avatar for experience posts.
 *
 * That distinction is why `photoIsRepresentative` exists and why the UI labels
 * business images. "King of Gyro" is a real restaurant; showing a stock photo
 * of someone else's kitchen without saying so would misrepresent them. Replace
 * this whole module the moment there is a real photoUrl to show.
 */

// Deterministic 32-bit hash. Same listing -> same image on every render and
// every reload, which matters because a photo that reshuffles on each paint
// reads as a bug.
function hash(value) {
	let h = 2166136261;
	const text = String(value ?? "");
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return Math.abs(h);
}

// Search terms per category, picked so the result reads as that kind of place.
// Multiple terms per category so two neighbouring FOOD pins don't collide.
const PHOTO_TERMS = {
	FOOD: ["restaurant-food", "kebab", "biryani", "cafe-interior", "grocery-store"],
	BARBER: ["barbershop", "barber-chair", "haircut"],
	CLOTHING: ["clothing-store", "fabric-shop", "boutique"],
	EDUCATION: ["classroom", "library-books", "tutoring"],
	HEALTH: ["pharmacy", "clinic", "medical-office"],
	SERVICES: ["workshop-tools", "office-desk", "repair-shop"],
	RETAIL: ["storefront", "shop-shelves", "market-stall"],
	OTHER: ["storefront", "neighbourhood-street"]
};

export function businessPhoto(listing, size = 200) {
	const terms = PHOTO_TERMS[listing?.category] ?? PHOTO_TERMS.OTHER;
	const seed = hash(`${listing?.id}-${listing?.businessName}`);
	const term = terms[seed % terms.length];
	// `lock` is loremflickr's determinism knob: same lock, same photo.
	return `https://loremflickr.com/${size}/${size}/${term}?lock=${seed % 10000}`;
}

/*
 * Experience avatars are generated illustrations, not photographs of people.
 * A stock photo of a real stranger's face attached to a named post by someone
 * else would be a worse lie than a stock storefront - these read as avatars,
 * which is what they are. The composer never asks for one; it is derived.
 */
// One style, varied by seed. Mixing several styles was tried and looked like a
// bug - line-art faces sitting next to abstract blobs reads as broken data
// rather than as variety. The seed alone gives every poster a distinct avatar.
const AVATAR_STYLE = "notionists-neutral";

export function experienceAvatar(listing, size = 200) {
	const seed = hash(`${listing?.id}-${listing?.ownerName}`);
	return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=f6dcff,ffd9ec,e5d4ff&radius=50`;
}

export function avatarFor(listing, size = 200) {
	return isExperience(listing) ? experienceAvatar(listing, size) : businessPhoto(listing, size);
}

/** True when the image only suggests the category rather than depicting the actual place. */
export function photoIsRepresentative(listing) {
	return !isExperience(listing);
}
