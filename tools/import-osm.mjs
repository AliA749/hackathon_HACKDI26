#!/usr/bin/env node
/*
 * Bulk-imports halal-tagged New Jersey businesses from OpenStreetMap.
 *
 * WHY OSM AND NOT THE OTHER DIRECTORIES
 * -------------------------------------
 * OpenStreetMap is published under the Open Database License, which expressly
 * permits reuse - including in a product like this one - as long as the source
 * is credited and derived databases stay under the same licence. That credit
 * is why every imported row carries "OpenStreetMap contributors" as its owner
 * name rather than an invented person.
 *
 * The commercial halal directories are a different situation and are
 * deliberately NOT sources here:
 *   - halalfood.com Terms of Use section 10: "You may not scrape, copy, or
 *     redistribute platform content without written permission."
 *   - zabihah.com Terms of Service prohibit "automated data collection", and
 *     its robots.txt sets `Disallow: /api/` for every user-agent.
 * Copying either into this app would breach those terms. Ask them for a data
 * partnership instead - see README.
 *
 * ON THE WORD "HALAL"
 * -------------------
 * Only places OSM actually tags `diet:halal=yes|only` are imported, and the
 * description says the tag is community-maintained rather than asserting the
 * business is certified. Halal status is a religious obligation, not a
 * cuisine label: a wrong "halal" claim causes someone to break their diet.
 * Widening this query to "Middle Eastern / Turkish / Pakistani cuisine" would
 * roughly double the row count and is a tempting way to look more impressive,
 * but it would be inventing halal claims about real restaurants. Don't.
 *
 * USAGE
 *   node tools/import-osm.mjs --dry-run     # preview, write nothing
 *   node tools/import-osm.mjs               # import into http://localhost:8080
 *   node tools/import-osm.mjs --purge       # remove every row this tool created
 *   node tools/import-osm.mjs --api http://localhost:8080
 *
 * Safe to re-run: rows already present (same name within 250m) are skipped.
 */

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const API = (() => {
	const i = args.indexOf("--api");
	return i >= 0 && args[i + 1] ? args[i + 1].replace(/\/$/, "") : "http://localhost:8080";
})();

const OVERPASS = "https://overpass-api.de/api/interpreter";

// Restricted to diet:halal on purpose - see the note above.
const QUERY = `
[out:json][timeout:150];
area["ISO3166-2"="US-NJ"][admin_level=4]->.nj;
(
  node["diet:halal"~"yes|only"]["name"](area.nj);
  way["diet:halal"~"yes|only"]["name"](area.nj);
  node["shop"~"butcher|supermarket|convenience|greengrocer|bakery"]["name"]["diet:halal"](area.nj);
  way["shop"~"butcher|supermarket|convenience|greengrocer|bakery"]["name"]["diet:halal"](area.nj);
);
out center tags;
`;

const OWNER = "OpenStreetMap contributors";

/*
 * National chains, excluded on purpose.
 *
 * The first import pulled 56 rows, and 26 of them were chains - 13 Wawas, 5
 * ShopRites, 3 McDonald's. They carry diet:halal=yes because a mapper noted a
 * single halal item on the shelf (and in McDonald's case the tag is very
 * likely just wrong; there are no halal-certified McDonald's in New Jersey).
 *
 * Two reasons they don't belong in this app. It is a directory of Muslim-owned
 * and Muslim-serving local businesses, and a gas-station convenience store is
 * neither. And practically: thirteen identical "Wawa" cards push the actual
 * community businesses off the first screen of the sidebar, which is the exact
 * opposite of what the product is for.
 *
 * Matched on the whole name, case-insensitively, so a genuinely local business
 * whose name merely contains one of these words is not caught.
 */
const CHAIN_DENYLIST = new Set([
	"wawa", "shoprite", "shop rite", "mcdonald's", "mcdonalds", "dunkin'", "dunkin", "dunkin donuts",
	"wendy's", "wendys", "trader joe's", "trader joes", "7-eleven", "7 eleven", "seven eleven",
	"quickchek", "quick chek", "burger king", "subway", "starbucks", "walmart", "target", "costco",
	"stop & shop", "stop and shop", "acme", "whole foods", "whole foods market", "popeyes",
	"popeyes louisiana kitchen", "kfc", "taco bell", "chipotle", "panera", "panera bread",
	"rite aid", "cvs", "cvs pharmacy", "walgreens", "speedway", "sunoco", "royal farms",
	"cumberland farms", "aldi", "lidl", "bj's wholesale club", "sam's club", "food lion",
	"dollar general", "family dollar", "dollar tree", "five guys", "chick-fil-a", "domino's",
	"domino's pizza", "papa john's", "pizza hut", "white castle", "checkers", "rally's"
]);

function isChain(name) {
	return CHAIN_DENYLIST.has(name.trim().toLowerCase());
}

const FOOD_SHOPS = new Set(["butcher", "supermarket", "convenience", "greengrocer", "bakery", "deli", "food"]);
const FOOD_AMENITIES = new Set(["restaurant", "fast_food", "cafe", "ice_cream", "food_court"]);

function toCategory(tags) {
	if (FOOD_AMENITIES.has(tags.amenity) || FOOD_SHOPS.has(tags.shop)) return "FOOD";
	if (tags.shop === "clothes" || tags.shop === "boutique") return "CLOTHING";
	if (tags.shop === "hairdresser" || tags.shop === "barber") return "BARBER";
	if (tags.amenity === "pharmacy" || tags.amenity === "clinic" || tags.amenity === "doctors") return "HEALTH";
	if (tags.amenity === "school" || tags.amenity === "college") return "EDUCATION";
	if (tags.shop) return "RETAIL";
	return "OTHER";
}

/*
 * `diet:halal` has two meanings and conflating them is the one mistake this
 * importer must not make:
 *   only -> everything sold is halal
 *   yes  -> halal options are available, the venue is not necessarily halal
 * In this dataset 55 of 56 rows are `yes`, and they include Dunkin' and a
 * ShopRite. Describing those as "a halal restaurant" would tell an observant
 * user the whole menu is safe when the tag only ever claimed some of it is.
 */
function placeNoun(tags) {
	if (tags.shop === "butcher") return "Butcher";
	if (tags.shop === "supermarket" || tags.shop === "convenience") return "Grocery store";
	if (tags.shop === "bakery") return "Bakery";
	if (tags.shop === "greengrocer") return "Greengrocer";
	if (tags.shop) return tags.shop.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
	if (tags.amenity === "fast_food") return "Fast food spot";
	if (tags.amenity === "cafe") return "Cafe";
	if (tags.amenity === "restaurant") return "Restaurant";
	return "Business";
}

function kindLabel(tags) {
	const noun = placeNoun(tags);
	return tags["diet:halal"] === "only"
		? `${noun} - fully halal`
		: `${noun} with halal options`;
}

function describe(tags) {
	const bits = [kindLabel(tags)];

	const cuisine = (tags.cuisine ?? "")
		.split(";")
		.map((c) => c.trim().replace(/_/g, " "))
		.filter(Boolean);
	if (cuisine.length) bits.push(`serving ${cuisine.slice(0, 3).join(", ")}`);

	const where = [tags["addr:street"] && `${tags["addr:housenumber"] ?? ""} ${tags["addr:street"]}`.trim(), tags["addr:city"]]
		.filter(Boolean)
		.join(", ");
	if (where) bits.push(`at ${where}`);

	let text = `${bits.join(" ")}.`;
	// Provenance belongs in the row itself: a reader should not have to guess
	// whether a human vouched for this or a bulk import created it.
	text += tags["diet:halal"] === "only"
		? " Imported from OpenStreetMap (diet:halal=only). Community-maintained, not independently certified - confirm with the business."
		: " Imported from OpenStreetMap (diet:halal=yes), meaning halal options are available rather than the whole menu. Community-maintained, not certified - confirm with the business.";
	if (tags.phone || tags["contact:phone"]) text += ` Phone ${tags.phone ?? tags["contact:phone"]}.`;

	return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

function website(tags) {
	const raw = tags.website ?? tags["contact:website"] ?? "";
	if (!raw) return "";
	const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
	// The backend rejects anything over 255 or not http(s); drop rather than
	// fail the whole row over a cosmetic field.
	return url.length <= 255 && /^https?:\/\/.+/.test(url) ? url : "";
}

// Rough metres between two lat/lngs. Good enough to spot "same shop, moved a
// few doors" without pulling in a geo library.
function metresBetween(a, b) {
	const R = 6371000;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

/*
 * Removes previously imported rows so a bad import can be rolled back.
 * Scoped to ownerName === OWNER, which is the only marker distinguishing
 * machine-imported rows from ones a human posted - deleting by anything looser
 * would take community submissions with it.
 */
async function purge() {
	const existing = await (await fetch(`${API}/api/listings`)).json();
	const mine = existing.filter((l) => l.ownerName === OWNER);
	console.log(`${existing.length} listings, ${mine.length} of them imported from OpenStreetMap`);

	if (DRY_RUN) {
		console.log("Dry run - nothing deleted.");
		return;
	}

	let removed = 0;
	for (const l of mine) {
		const r = await fetch(`${API}/api/listings/${l.id}`, { method: "DELETE" });
		if (r.ok || r.status === 404) removed++;
	}
	console.log(`Deleted ${removed}. Human-posted listings left untouched: ${existing.length - mine.length}`);
}

async function main() {
	if (args.includes("--purge")) {
		return purge();
	}

	process.stdout.write("Querying OpenStreetMap... ");

	// Overpass is a free, shared, heavily rate-limited service. 429 (slot
	// exhausted) and 504 (query queued too long) are routine, not bugs, and a
	// bare failure here would look like the importer is broken.
	let res;
	for (let attempt = 1; attempt <= 4; attempt++) {
		res = await fetch(OVERPASS, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				// Overpass answers 406 to Node's default undici user-agent.
				// Identifying the tool is also what their usage policy asks for.
				"User-Agent": "ummah-local-nj-importer/1.0 (hackathon project; contact via repo)"
			},
			body: new URLSearchParams({ data: QUERY })
		});
		if (res.ok) break;
		if (res.status !== 429 && res.status !== 504) {
			throw new Error(`Overpass returned ${res.status}`);
		}
		if (attempt === 4) {
			throw new Error(
				`Overpass is rate-limiting this machine (${res.status}). It frees up on its own - wait a minute and re-run.`
			);
		}
		const waitSeconds = 15 * attempt;
		process.stdout.write(`rate-limited (${res.status}), retrying in ${waitSeconds}s... `);
		await new Promise((r) => setTimeout(r, waitSeconds * 1000));
	}

	const { elements } = await res.json();
	console.log(`${elements.length} elements`);

	const candidates = elements
		.map((el) => {
			const lat = el.lat ?? el.center?.lat;
			const lon = el.lon ?? el.center?.lon;
			if (lat == null || lon == null || !el.tags?.name) return null;
			return {
				ownerName: OWNER,
				businessName: el.tags.name.slice(0, 100),
				category: toCategory(el.tags),
				comment: describe(el.tags),
				websiteUrl: website(el.tags),
				latitude: lat,
				longitude: lon
			};
		})
		.filter(Boolean);

	console.log(`${candidates.length} usable records (named + geocoded)`);

	const chains = candidates.filter((c) => isChain(c.businessName));
	const local = candidates.filter((c) => !isChain(c.businessName));
	if (chains.length) {
		const names = [...new Set(chains.map((c) => c.businessName))].join(", ");
		console.log(`${chains.length} national-chain rows excluded (${names})`);
	}

	const existing = await (await fetch(`${API}/api/listings`)).json();
	console.log(`${existing.length} listings already in the app`);

	// Skip anything that already exists under the same name within 250m. Reruns
	// after a partial failure should top up, not duplicate the whole state.
	const fresh = local.filter((c) => {
		return !existing.some(
			(e) =>
				e.businessName.toLowerCase() === c.businessName.toLowerCase() &&
				metresBetween({ lat: e.latitude, lng: e.longitude }, { lat: c.latitude, lng: c.longitude }) < 250
		);
	});

	const byCategory = fresh.reduce((acc, c) => ({ ...acc, [c.category]: (acc[c.category] ?? 0) + 1 }), {});
	console.log(`${fresh.length} new to import  ${JSON.stringify(byCategory)}`);
	console.log(`${local.length - fresh.length} skipped as already present\n`);

	if (DRY_RUN) {
		fresh.slice(0, 10).forEach((c) => console.log(`  [${c.category}] ${c.businessName} - ${c.comment.slice(0, 80)}...`));
		if (fresh.length > 10) console.log(`  ... and ${fresh.length - 10} more`);
		console.log("\nDry run - nothing written.");
		return;
	}

	let ok = 0;
	const failures = [];
	for (const c of fresh) {
		const r = await fetch(`${API}/api/listings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(c)
		});
		if (r.ok) ok++;
		else failures.push({ name: c.businessName, status: r.status, body: (await r.text()).slice(0, 200) });
	}

	console.log(`Imported ${ok}/${fresh.length}`);
	if (failures.length) {
		console.log(`\n${failures.length} failed:`);
		failures.slice(0, 10).forEach((f) => console.log(`  ${f.name} -> ${f.status} ${f.body}`));
	}
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
