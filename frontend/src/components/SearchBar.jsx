import { useState } from "react";
import { CATEGORIES } from "../constants/categories.js";

export default function SearchBar({ onSearch }) {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("");

	function submit(event) {
		event.preventDefault();
		onSearch({ query: query.trim() || undefined, category: category || undefined });
	}

	return (
		<form className="search-bar" onSubmit={submit} role="search">
			<input
				type="search"
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder="Search businesses or services..."
				aria-label="Search businesses or services"
			/>
			<select
				value={category}
				onChange={(event) => setCategory(event.target.value)}
				aria-label="Filter by category"
			>
				<option value="">All categories</option>
				{CATEGORIES.map((option) => (
					<option key={option.value} value={option.value}>{option.label}</option>
				))}
			</select>
			<button className="primary-button" type="submit">Search</button>
		</form>
	);
}
