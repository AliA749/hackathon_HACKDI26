import SearchBar from "./SearchBar.jsx";
import { EXPERIENCE, EXPERIENCE_CATEGORY, SERVICE, SERVICE_CATEGORIES } from "../constants/categories.js";

/*
 * The inspiration header carries a nav (Directory / Community Feed / Saved)
 * and a notifications bell. Those screens do not exist, so rather than ship
 * dead links the second row is the real category filter - same visual rhythm,
 * and it actually drives the query.
 */
export default function Header({ activeCategory, activeKind, onCategory, onKind, onSearch, onAddClick }) {
	return (
		<header className="flex-shrink-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_12px_rgba(13,92,70,0.06)]">
			<div className="h-20 w-full px-margin-tablet xl:px-margin-desktop flex items-center justify-between gap-gutter-base">
				<div className="flex items-center gap-gutter-lg flex-shrink-0">
					<div className="flex items-center gap-gutter-sm">
						<span className="w-9 h-9 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-[0_4px_12px_rgba(13,92,70,0.2)]">
							<span className="material-symbols-outlined text-[20px]" aria-hidden="true">mosque</span>
						</span>
						<span className="font-headline-lg text-headline-lg text-primary tracking-tight hidden sm:inline">
							Ummah Local
						</span>
					</div>

					<span className="hidden lg:flex items-center gap-gutter-xs px-3 py-1.5 rounded-full bg-surface-container text-on-surface">
						<span className="material-symbols-outlined text-secondary text-[18px]" aria-hidden="true">location_on</span>
						<span className="font-label-md text-label-md">New Jersey</span>
					</span>
				</div>

				<div className="flex-1 max-w-2xl flex items-center gap-gutter-sm">
					<SearchBar onSearch={onSearch} />
				</div>

				<div className="flex items-center gap-gutter-md flex-shrink-0">
					<button
						className="flex items-center gap-gutter-xs bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl transition-all shadow-[0_6px_16px_-2px_rgba(13,92,70,0.12)] active:scale-95"
						type="button"
						onClick={onAddClick}
					>
						<span className="material-symbols-outlined text-[20px]" aria-hidden="true">add_circle</span>
						<span className="font-label-lg text-label-lg hidden md:inline">Add a pin</span>
					</button>
				</div>
			</div>

			{/*
			  Two rows because there are two things to choose, and folding them
			  into one strip made "Experience" look like a ninth kind of shop.
			  Row one picks what you are looking for at all; row two narrows a
			  business search by trade, and is irrelevant to experiences - which
			  have no sub-categories - so it hides itself in that mode.
			*/}
			<div className="w-full bg-surface-container-lowest px-margin-tablet xl:px-margin-desktop pt-2.5 flex items-center gap-gutter-sm overflow-x-auto scrollbar-none">
				<span className="font-label-tag text-label-tag text-outline uppercase tracking-wider whitespace-nowrap mr-2">
					Looking for:
				</span>

				<button
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
						activeKind ? "bg-surface-container text-on-surface hover:bg-surface-container-high" : "bg-primary text-on-primary"
					}`}
					type="button"
					onClick={() => onKind(undefined)}
				>
					Everything
				</button>

				<button
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
						activeKind === SERVICE
							? "bg-primary text-on-primary"
							: "bg-surface-container text-on-surface hover:bg-surface-container-high"
					}`}
					type="button"
					aria-pressed={activeKind === SERVICE}
					onClick={() => onKind(activeKind === SERVICE ? undefined : SERVICE)}
				>
					<span className="material-symbols-outlined text-[15px]" aria-hidden="true">storefront</span>
					Businesses
				</button>

				<button
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
						activeKind === EXPERIENCE ? "text-white" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
					}`}
					style={activeKind === EXPERIENCE ? { background: EXPERIENCE_CATEGORY.ink, color: EXPERIENCE_CATEGORY.on } : undefined}
					type="button"
					aria-pressed={activeKind === EXPERIENCE}
					onClick={() => onKind(activeKind === EXPERIENCE ? undefined : EXPERIENCE)}
				>
					<span
						className="material-symbols-outlined text-[15px]"
						style={activeKind === EXPERIENCE ? undefined : { color: EXPERIENCE_CATEGORY.ink }}
						aria-hidden="true"
					>
						{EXPERIENCE_CATEGORY.icon}
					</span>
					Experiences
				</button>
			</div>

			{activeKind !== EXPERIENCE && (
				<div className="w-full bg-surface-container-lowest px-margin-tablet xl:px-margin-desktop py-2.5 flex items-center gap-gutter-sm overflow-x-auto scrollbar-none">
					<span className="font-label-tag text-label-tag text-outline uppercase tracking-wider whitespace-nowrap mr-2">
						Trade:
					</span>

					<button
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
							activeCategory
								? "bg-surface-container text-on-surface hover:bg-surface-container-high"
								: "bg-primary text-on-primary"
						}`}
						type="button"
						onClick={() => onCategory(undefined)}
					>
						All Places
					</button>

					{SERVICE_CATEGORIES.map((category) => {
						const active = activeCategory === category.value;
						return (
							<button
								key={category.value}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
									active
										? "bg-primary text-on-primary"
										: "bg-surface-container text-on-surface hover:bg-surface-container-high"
								}`}
								type="button"
								onClick={() => onCategory(active ? undefined : category.value)}
							>
								<span
									className="material-symbols-outlined text-[15px]"
									style={active ? undefined : { color: category.ink }}
									aria-hidden="true"
								>
									{category.icon}
								</span>
								{category.label}
							</button>
						);
					})}
				</div>
			)}
		</header>
	);
}
