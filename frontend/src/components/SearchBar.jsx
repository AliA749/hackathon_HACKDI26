import { useState } from "react";

export default function SearchBar({ onSearch }) {
	const [query, setQuery] = useState("");

	function submit(event) {
		event.preventDefault();
		onSearch(query.trim() || undefined);
	}

	function clear() {
		setQuery("");
		onSearch(undefined);
	}

	return (
		<form
			className="relative flex-1 flex items-center bg-surface-container-low rounded-full px-4 py-2 shadow-[0_1px_3px_rgba(13,92,70,0.04)] focus-within:bg-surface-container-lowest focus-within:shadow-[0_4px_16px_rgba(13,92,70,0.1)] transition-all"
			onSubmit={submit}
			role="search"
		>
			<span className="material-symbols-outlined text-outline mr-2 text-[20px]" aria-hidden="true">search</span>
			<input
				className="w-full bg-transparent font-body-base text-body-base text-on-surface placeholder:text-outline focus:outline-none"
				type="search"
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder="Find halal food, barbers, tutors, modest wear..."
				aria-label="Search businesses"
			/>
			{query && (
				<button
					className="p-1 rounded-full text-outline hover:text-on-surface transition-colors"
					type="button"
					onClick={clear}
					aria-label="Clear search"
				>
					<span className="material-symbols-outlined text-[18px]">close</span>
				</button>
			)}
			<button
				className="ml-1 px-3 py-1 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors"
				type="submit"
			>
				Search
			</button>
		</form>
	);
}
