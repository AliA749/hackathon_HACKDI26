#!/usr/bin/env node
/*
 * Seeds EXPERIENCE pins so the two-kinds-of-pin feature is visible on load.
 *
 * WHAT AN EXPERIENCE IS
 * ---------------------
 * Somebody's account of what a place or area was actually like - not a listing
 * for a business. Per ValidPostValidator an experience must carry NO
 * businessName and NO websiteUrl (a hand-rolled request that includes either
 * gets a 400, deliberately, so an advert cannot wear an experience's clothes).
 * `category` is @NotNull on the request, so it goes over the wire as OTHER and
 * `kind=EXPERIENCE` is the real discriminator - see BusinessCategory.java for
 * why that enum must not grow an EXPERIENCE member.
 *
 * THESE ARE WRITTEN, NOT COLLECTED
 * --------------------------------
 * Every entry below is invented demo content. No real person said any of it and
 * none of it is a survey result, so do not present it as user-submitted data or
 * quote it as evidence about a town. It exists because the feature renders
 * nothing without rows, and a reviewer cannot evaluate an empty feed.
 *
 * The tone is deliberately mixed rather than uniformly glowing. Testimonials
 * that are all positive read as marketing copy; a few entries name real
 * friction (no wudu facilities, feeling isolated at the shore) because that is
 * what an honest account of a place sounds like. Keep that balance if you add
 * more.
 *
 * Coordinates are real points in NJ towns with established Muslim communities.
 * The backend runs ray-casting point-in-polygon against the true state outline,
 * so a sloppy point near the Delaware or the Hudson gets a 400 rather than
 * silently landing in Pennsylvania or Staten Island.
 *
 * USAGE
 *   node tools/seed-experiences.mjs --dry-run   # preview, write nothing
 *   node tools/seed-experiences.mjs             # seed into http://localhost:8080
 *   node tools/seed-experiences.mjs --purge     # remove every row this tool created
 *   node tools/seed-experiences.mjs --api http://localhost:8080
 *
 * Safe to re-run: an entry whose owner name is already present as an
 * EXPERIENCE is skipped rather than duplicated.
 */

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const PURGE = args.includes("--purge");
const API = (() => {
	const i = args.indexOf("--api");
	return i >= 0 && args[i + 1] ? args[i + 1].replace(/\/$/, "") : "http://localhost:8080";
})();

const EXPERIENCES = [
	{
		ownerName: "Yusuf Abdallah",
		latitude: 40.9048, longitude: -74.1718, // South Paterson
		comment: "Walked down Main Street here for the first time and heard three languages before I reached the corner. Bakeries open past midnight, everyone says salaam. If you've ever felt like the only Muslim in your town, spend an afternoon here."
	},
	{
		ownerName: "Amina Sheikh",
		latitude: 40.8584, longitude: -74.1638, // Clifton
		comment: "Jummah overflows into the parking lot by 1pm. Come early if you want to be inside, and bring your own mat in summer. The khutbah is in English and Arabic, which made it easy to bring my non-Arabic-speaking husband."
	},
	{
		ownerName: "Bilal Rahman",
		latitude: 40.7178, longitude: -74.0431, // Jersey City
		comment: "Wudu options around the waterfront are basically nonexistent. A shop owner let me use his back sink without making it awkward. Small thing, but it changed how I felt about praying on time in this neighborhood."
	},
	{
		ownerName: "Fatima Noor",
		latitude: 40.5187, longitude: -74.4121, // Edison
		comment: "Took my mother here for groceries and she found spices she hasn't seen since she left home. We ended up staying two hours. Parking is genuinely difficult on weekends - go on a weekday morning if you can."
	},
	{
		ownerName: "Omar Siddiqui",
		latitude: 40.4993, longitude: -74.3946, // Piscataway
		comment: "Prayed Maghrib here as a total stranger and three brothers insisted I stay for tea afterward. I was passing through for work and left with two phone numbers and an invitation to iftar."
	},
	{
		ownerName: "Khadija Toure",
		latitude: 40.7357, longitude: -74.1724, // Newark
		comment: "As a revert I was nervous walking in alone. A sister noticed, sat with me, and walked me through the prayer without once making me feel stupid. Been coming back every week since."
	},
	{
		ownerName: "Ibrahim Chowdhury",
		latitude: 40.4862, longitude: -74.4518, // New Brunswick
		comment: "Campus area has more halal options than I expected as a student - carts, a couple of proper restaurants, and a grocery a short bus ride out. Ramadan here is genuinely social rather than lonely."
	},
	{
		ownerName: "Maryam Haque",
		latitude: 40.8976, longitude: -74.0160, // Teaneck
		comment: "Quiet, family-heavy area. Playgrounds full of kids after Asr and nobody stares at hijab. My daughter asked why people here 'look like us' - first time she's asked that in a good way."
	},
	{
		ownerName: "Hassan Qureshi",
		latitude: 40.6639, longitude: -74.2107, // Elizabeth
		comment: "Eid prayer in the open lot here was maybe two thousand people. Traffic afterward was chaos and worth every minute. Bring cash for the kids' stalls, several don't take cards."
	},
	{
		ownerName: "Sumaya Ali",
		latitude: 40.8568, longitude: -74.1285, // Passaic
		comment: "Found a small prayer room tucked behind a shop that isn't marked on any map. The owner keeps it clean and unlocked for anyone who needs it. Ask politely and someone will point you to it."
	},
	{
		ownerName: "Tariq Mansour",
		latitude: 39.9348, longitude: -75.0307, // Cherry Hill
		comment: "South Jersey gets written off as having nothing, which isn't fair. Smaller community here but tight - people actually notice if you miss a week. Halal meat counter at the market is the real find."
	},
	{
		ownerName: "Zainab Osman",
		latitude: 40.5087, longitude: -74.5321, // Franklin Township, Somerset
		comment: "Weekend Islamic school run out of the community center. My son went in shy and came out with friends. Volunteers do it unpaid, which you can feel in how much they care."
	},
	{
		ownerName: "Ahmad Bekele",
		latitude: 40.6687, longitude: -74.1143, // Bayonne
		comment: "Working nights, I needed somewhere open for Fajr. Found a masjid that unlocks early and a diner nearby that does eggs without bacon touching the pan if you ask. Not glamorous, but it made the shift bearable."
	},
	{
		ownerName: "Layla Karim",
		latitude: 40.3573, longitude: -74.6672, // Princeton
		comment: "Prayer space on the quieter end of town, small but well kept. Mixed crowd of students and families. First place I prayed after moving to NJ and it made an intimidating town feel manageable."
	},
	{
		ownerName: "Mustafa Genc",
		latitude: 40.9445, longitude: -74.0748, // Paramus
		comment: "Mostly here for the shopping, but there's a quiet corner near the back of one of the centers where people pray. No signage, you just see shoes lined up. Somebody always makes room."
	},
	{
		ownerName: "Aisha Diallo",
		latitude: 39.9537, longitude: -74.1979, // Toms River
		comment: "Shore area feels isolated if you're visibly Muslim, I won't pretend otherwise. But the small group that meets here is warm and has been building slowly for years. Worth the drive if you're nearby and feeling alone."
	}
];

const SEEDED_NAMES = new Set(EXPERIENCES.map((e) => e.ownerName));

async function listAll() {
	const res = await fetch(`${API}/api/listings`);
	if (!res.ok) {
		throw new Error(`GET /api/listings returned ${res.status}`);
	}
	return res.json();
}

function isSeededExperience(listing) {
	return (listing.kind ?? "SERVICE") === "EXPERIENCE" && SEEDED_NAMES.has(listing.ownerName);
}

async function purge() {
	const mine = (await listAll()).filter(isSeededExperience);
	if (mine.length === 0) {
		console.log("Nothing to purge - no rows from this tool are present.");
		return;
	}
	console.log(`Purging ${mine.length} seeded experience(s) from ${API}\n`);
	for (const l of mine) {
		const res = await fetch(`${API}/api/listings/${l.id}`, { method: "DELETE" });
		console.log(`  ${res.status} removed #${l.id} ${l.ownerName}`);
	}
}

async function seed() {
	// Re-runnable: skip anyone already in the feed rather than posting twins.
	const existingNames = new Set(
		(await listAll()).filter((l) => (l.kind ?? "SERVICE") === "EXPERIENCE").map((l) => l.ownerName)
	);

	console.log(`${DRY_RUN ? "DRY RUN - " : ""}${EXPERIENCES.length} experiences -> ${API}\n`);
	let created = 0;
	let skipped = 0;
	let failed = 0;

	for (const e of EXPERIENCES) {
		if (existingNames.has(e.ownerName)) {
			console.log(`  --  skip    ${e.ownerName} (already present)`);
			skipped++;
			continue;
		}

		if (DRY_RUN) {
			console.log(`  --  would post ${e.ownerName.padEnd(20)} ${e.latitude}, ${e.longitude}`);
			continue;
		}

		// businessName and websiteUrl are deliberately absent, not empty:
		// ValidPost rejects an experience that carries either.
		const res = await fetch(`${API}/api/listings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				ownerName: e.ownerName,
				category: "OTHER",
				kind: "EXPERIENCE",
				comment: e.comment,
				latitude: e.latitude,
				longitude: e.longitude
			})
		});

		if (res.ok) {
			const body = await res.json();
			console.log(`  ${res.status} #${String(body.id).padEnd(4)} ${e.ownerName}`);
			created++;
		}
		else {
			// A 400 here is almost always the point-in-polygon check rejecting a
			// coordinate, so print the body - it names the offending field.
			console.log(`  ${res.status} FAILED  ${e.ownerName} -> ${(await res.text()).slice(0, 300)}`);
			failed++;
		}
	}

	console.log(`\n${DRY_RUN ? "would create" : "created"} ${DRY_RUN ? EXPERIENCES.length - skipped : created}, skipped ${skipped}, failed ${failed}`);
}

try {
	await (PURGE ? purge() : seed());
}
catch (err) {
	console.error(`\nseed-experiences failed: ${err.message}`);
	console.error(`Is the backend running on ${API}?  Start it with .\\start-dev.ps1`);
	process.exit(1);
}
