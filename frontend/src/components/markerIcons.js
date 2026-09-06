import L from "leaflet";
import { isExperience, metaFor } from "../constants/categories.js";
import { avatarFor } from "../utils/media.js";

// The mock frames each pin with a contributor photo. We have no photos, so the
// circle carries the poster's initials instead - same silhouette, real data.
function initials(name) {
	const parts = String(name || "")
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) {
		return "?";
	}
	const first = parts[0][0];
	const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
	return (first + last).toUpperCase();
}

function escapeHtml(value) {
	return String(value ?? "").replace(
		/[&<>"']/g,
		(char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
	);
}

/*
 * Anchored at the stem tip (not the box centre) so the point of the teardrop
 * sits on the real coordinate. The name capsule hangs below that point, which
 * is what the mock does.
 */
/*
 * Experience pins are identified by a TEXT mark, not a category glyph - a
 * business says "fork and spoon", an experience says the word "Experience".
 * The circle carries the generated avatar rather than initials, and there is
 * no business name capsule because an experience has no business name; the
 * poster's name goes there instead.
 */
export function experiencePin(listing) {
	const meta = metaFor(listing);
	const who = escapeHtml(listing.ownerName);
	const avatar = escapeHtml(avatarFor(listing, 96));

	return L.divIcon({
		className: "pin-marker-icon",
		html: `
			<div class="relative flex flex-col items-center select-none">
				<div class="relative flex flex-col items-center" style="filter: drop-shadow(0 8px 16px rgba(109,59,122,0.28));">
					<div class="relative w-[52px] h-[52px] p-1 rounded-full bg-white" style="box-shadow: inset 0 0 0 2px ${meta.ink};">
						<img src="${avatar}" alt="" class="w-11 h-11 rounded-full object-cover"
							style="background:${meta.on};" loading="lazy" />
					</div>
					<div class="-mt-1 w-2.5 h-2.5 rotate-45 rounded-[1px] bg-white"
						style="box-shadow: 2px 2px 0 0 ${meta.ink};"></div>
				</div>
				<div class="mt-1 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full whitespace-nowrap"
					style="box-shadow: 0 4px 16px rgba(109,59,122,0.18); border: 1px solid rgba(109,59,122,0.25);">
					<span class="font-label-tag text-label-tag font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
						style="background:${meta.ink};color:${meta.on};">Experience</span>
					<span class="font-label-md text-label-md font-bold text-on-surface">${who}</span>
				</div>
			</div>
		`,
		iconSize: [220, 108],
		iconAnchor: [110, 62],
		popupAnchor: [0, -62]
	});
}

export function businessPin(listing) {
	if (isExperience(listing)) {
		return experiencePin(listing);
	}

	const meta = metaFor(listing);
	const name = escapeHtml(listing.businessName ?? listing.ownerName);
	const photo = escapeHtml(avatarFor(listing, 96));

	return L.divIcon({
		className: "pin-marker-icon",
		html: `
			<div class="relative flex flex-col items-center select-none group">
				<div class="relative flex flex-col items-center" style="filter: drop-shadow(0 8px 16px rgba(13,92,70,0.22));">
					<div class="relative w-[52px] h-[52px] p-1 rounded-full bg-white" style="box-shadow: inset 0 0 0 2px ${meta.ink};">
						<img src="${photo}" alt="" class="w-11 h-11 rounded-full object-cover"
							style="background:${meta.ink};" loading="lazy"
							onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
						<div class="w-11 h-11 rounded-full items-center justify-center font-extrabold text-[15px]"
							style="display:none;background:${meta.ink};color:${meta.on};">${escapeHtml(initials(listing.ownerName))}</div>
						<span class="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
							style="background:${meta.ink};color:${meta.on};box-shadow:0 0 0 2px #ffffff;">
							<span class="material-symbols-outlined" style="font-size:13px;">${meta.icon}</span>
						</span>
					</div>
					<div class="-mt-1 w-2.5 h-2.5 rotate-45 rounded-[1px] bg-white"
						style="box-shadow: 2px 2px 0 0 ${meta.ink};"></div>
				</div>
				<div class="mt-1 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full whitespace-nowrap"
					style="box-shadow: 0 4px 16px rgba(13,92,70,0.14); border: 1px solid rgba(191,201,194,0.5);">
					<span class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
						style="background:${meta.ink};color:${meta.on};">
						<span class="material-symbols-outlined" style="font-size:12px;">${meta.icon}</span>
					</span>
					<span class="font-label-md text-label-md font-bold text-on-surface">${name}</span>
				</div>
			</div>
		`,
		iconSize: [200, 108],
		iconAnchor: [100, 62],
		popupAnchor: [0, -62]
	});
}

// The blue "you are here" dot, deliberately a different shape and colour from
// every business pin so it never reads as a listing.
export function userLocationIcon() {
	return L.divIcon({
		className: "pin-marker-icon",
		html: `
			<div class="relative flex items-center justify-center select-none">
				<div class="absolute w-8 h-8 rounded-full bg-[#1a73e8]/25 animate-ping pointer-events-none"></div>
				<div class="relative w-4 h-4 rounded-full bg-[#1a73e8]"
					style="box-shadow: 0 0 0 3px #ffffff, 0 2px 8px rgba(0,0,0,0.3);"></div>
			</div>
		`,
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		popupAnchor: [0, -16]
	});
}

export function pendingIcon() {
	return L.divIcon({
		className: "pin-marker-icon",
		html: `
			<div class="relative flex flex-col items-center select-none">
				<div class="absolute -inset-1 rounded-full bg-[#004331]/25 animate-ping pointer-events-none"></div>
				<div class="relative flex flex-col items-center" style="filter: drop-shadow(0 8px 16px rgba(13,92,70,0.28));">
					<div class="w-[52px] h-[52px] p-1 rounded-full bg-white" style="box-shadow: inset 0 0 0 2px #004331;">
						<div class="w-11 h-11 rounded-full flex items-center justify-center bg-primary text-secondary-fixed">
							<span class="material-symbols-outlined" style="font-size:22px;">add_location_alt</span>
						</div>
					</div>
					<div class="-mt-1 w-2.5 h-2.5 rotate-45 rounded-[1px] bg-white" style="box-shadow: 2px 2px 0 0 #004331;"></div>
				</div>
			</div>
		`,
		iconSize: [72, 72],
		iconAnchor: [36, 62]
	});
}
