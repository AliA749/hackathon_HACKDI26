const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Compact relative time ("just now", "18m ago", "3d ago") for listing
 * timestamps. The mock shows star ratings here; we show when it was actually
 * posted, which is a field we really have.
 */
export function timeAgo(isoString) {
	if (!isoString) {
		return "";
	}

	const then = new Date(isoString).getTime();
	if (Number.isNaN(then)) {
		return "";
	}

	// Clamp: a clock skew between server and browser must not render "in 3m".
	const elapsed = Math.max(0, Date.now() - then);

	if (elapsed < MINUTE) {
		return "just now";
	}
	if (elapsed < HOUR) {
		return `${Math.floor(elapsed / MINUTE)}m ago`;
	}
	if (elapsed < DAY) {
		return `${Math.floor(elapsed / HOUR)}h ago`;
	}
	if (elapsed < 30 * DAY) {
		return `${Math.floor(elapsed / DAY)}d ago`;
	}

	return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function initials(name) {
	const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "?";
	}
	const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
	return (parts[0][0] + last).toUpperCase();
}
