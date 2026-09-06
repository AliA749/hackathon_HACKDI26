import { isExperience } from "../constants/categories.js";

/*
 * Imagery for pins and cards.
 *
 * Businesses have no imagery at all - they render as their category glyph on a
 * category-coloured tile. There is no photo field in the schema and none of the
 * imported OpenStreetMap records carry an `image` tag, so the only thing we
 * could show is a stock photo of somebody else's premises. That was tried,
 * sourced from loremflickr behind a "STOCK" badge, and removed when the host
 * went dark: every business tile then sat blank waiting on a TCP timeout that
 * never resolved. A glyph needs no network, cannot 404 mid-demo, and does not
 * put a stranger's kitchen under the name of a real restaurant.
 *
 * Experiences keep a generated DiceBear avatar. That is not a photograph of a
 * person either - it is an illustration, which is the honest way to give a
 * named personal post a face. Callers must still handle it failing to load.
 */

// Deterministic 32-bit hash. Same listing -> same avatar on every render and
// every reload, which matters because an avatar that reshuffles on each paint
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

// One style, varied by seed. Mixing several styles was tried and looked like a
// bug - line-art faces sitting next to abstract blobs reads as broken data
// rather than as variety. The seed alone gives every poster a distinct avatar.
const AVATAR_STYLE = "notionists-neutral";

export function experienceAvatar(listing, size = 200) {
	const seed = hash(`${listing?.id}-${listing?.ownerName}`);
	return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=f6dcff,ffd9ec,e5d4ff&radius=50`;
}

/**
 * Image URL for a listing, or `null` when it has none and the caller should
 * draw the category glyph instead. Only experiences ever return a URL.
 */
export function avatarFor(listing, size = 200) {
	return isExperience(listing) ? experienceAvatar(listing, size) : null;
}
